-- Automatización segura para Mis Pedidos.
-- Requiere la migración 20260904130000_business_orders_dashboard.sql.
-- Las credenciales del panel comercial se cifran con una clave mantenida en Supabase Vault.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

-- Vault conserva la clave fuera de las tablas y nunca se expone por PostgREST.
DO $$
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault must be enabled before applying business credential encryption';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'business_order_credentials_key'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'business_order_credentials_key',
      'Server-side key for encrypted business order credentials'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.business_order_credentials_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vault, pg_catalog, pg_temp
AS $$
DECLARE
  secret_value text;
BEGIN
  SELECT decrypted_secret
  INTO secret_value
  FROM vault.decrypted_secrets
  WHERE name = 'business_order_credentials_key'
  LIMIT 1;

  IF secret_value IS NULL OR char_length(secret_value) < 32 THEN
    RAISE EXCEPTION 'Business credential encryption key is unavailable';
  END IF;

  RETURN secret_value;
END;
$$;

REVOKE ALL ON FUNCTION private.business_order_credentials_key() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.delivered_accounts
  ADD COLUMN IF NOT EXISTS profile text NULL;

ALTER TABLE public.account_inventory
  ADD COLUMN IF NOT EXISTS profile text NULL;

CREATE TABLE IF NOT EXISTS public.business_order_credentials (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  email_ciphertext bytea NULL,
  profile_ciphertext bytea NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_order_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_order_credentials FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.business_order_credentials TO service_role;

CREATE OR REPLACE FUNCTION private.sync_business_order_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
  encryption_key text := private.business_order_credentials_key();
BEGIN
  INSERT INTO public.business_order_credentials (
    order_id,
    email_ciphertext,
    profile_ciphertext,
    updated_at
  ) VALUES (
    NEW.order_id,
    CASE WHEN NULLIF(btrim(NEW.email), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.email, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.profile), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.profile, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    now()
  )
  ON CONFLICT (order_id) DO UPDATE
  SET email_ciphertext = EXCLUDED.email_ciphertext,
      profile_ciphertext = EXCLUDED.profile_ciphertext,
      updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.sync_business_order_credentials() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS delivered_accounts_sync_business_credentials ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_sync_business_credentials
AFTER INSERT OR UPDATE OF email, profile ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION private.sync_business_order_credentials();

-- Cifra las referencias existentes. `notes` no se trata como perfil: únicamente
-- un perfil explícito puede aparecer en el panel para evitar mostrar datos no esperados.
INSERT INTO public.business_order_credentials (order_id, email_ciphertext, profile_ciphertext)
SELECT DISTINCT ON (account.order_id)
  account.order_id,
  CASE WHEN NULLIF(btrim(account.email), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.email, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.profile), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.profile, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END
FROM public.delivered_accounts AS account
ORDER BY account.order_id, account.created_at ASC NULLS LAST
ON CONFLICT (order_id) DO UPDATE
SET email_ciphertext = EXCLUDED.email_ciphertext,
    profile_ciphertext = EXCLUDED.profile_ciphertext,
    updated_at = now();

-- El correo deja de duplicarse en orders. El enlace de acceso no es una credencial
-- y continúa funcionando como referencia operativa.
CREATE OR REPLACE FUNCTION public.business_orders_sync_account_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.orders
  SET account_reference = COALESCE(NULLIF(NEW.access_link, ''), account_reference)
  WHERE id = NEW.order_id
    AND account_reference IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivered_accounts_business_reference ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_business_reference
AFTER INSERT OR UPDATE OF access_link ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION public.business_orders_sync_account_reference();

UPDATE public.orders AS order_row
SET account_reference = (
  SELECT delivery.access_link
  FROM public.delivered_accounts AS delivery
  WHERE delivery.order_id = order_row.id
  ORDER BY delivery.created_at ASC NULLS LAST
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM public.delivered_accounts AS delivery
  WHERE delivery.order_id = order_row.id
    AND delivery.email IS NOT NULL
    AND delivery.email = order_row.account_reference
);

-- De fecha a timestamp para que el cobro y la renovación respeten la hora exacta.
ALTER TABLE public.orders
  ALTER COLUMN auto_renew_at TYPE timestamptz
  USING CASE
    WHEN auto_renew_at IS NULL THEN NULL
    ELSE (auto_renew_at::timestamp AT TIME ZONE 'America/Lima')
  END;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS auto_renew_last_attempt_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS auto_renew_last_error text NULL;

CREATE INDEX IF NOT EXISTS orders_auto_renew_due_idx
  ON public.orders (auto_renew_at ASC)
  WHERE auto_renew IS TRUE AND auto_renew_at IS NOT NULL;

-- Las inserciones nuevas reciben una expiración con hora. Las fechas históricas
-- conservan el final del día local definido por la migración anterior.
CREATE OR REPLACE FUNCTION public.business_orders_fill_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seller_id uuid;
  resolved_client_id uuid;
  duration integer;
BEGIN
  IF NEW.business_status IS NULL THEN
    NEW.business_status := 'en_curso';
  END IF;

  IF NEW.expires_at IS NULL AND TG_OP = 'INSERT' THEN
    SELECT product.duration_days INTO duration
    FROM public.products AS product
    WHERE product.id::text = NEW.producto_id
    LIMIT 1;

    IF duration IS NOT NULL AND duration > 0 THEN
      NEW.expires_at := now() + make_interval(days => duration);
      NEW.fecha_vencimiento := (NEW.expires_at AT TIME ZONE 'America/Lima')::date;
    ELSIF NEW.fecha_vencimiento IS NOT NULL THEN
      NEW.expires_at := ((NEW.fecha_vencimiento::timestamp + time '23:59:59') AT TIME ZONE 'America/Lima');
    END IF;
  ELSIF NEW.expires_at IS NULL AND NEW.fecha_vencimiento IS NOT NULL THEN
    NEW.expires_at := ((NEW.fecha_vencimiento::timestamp + time '23:59:59') AT TIME ZONE 'America/Lima');
  END IF;

  IF COALESCE(NEW.auto_renew, false) AND NEW.auto_renew_at IS NULL AND NEW.expires_at IS NOT NULL THEN
    NEW.auto_renew_at := GREATEST(now(), NEW.expires_at - interval '3 days');
  ELSIF NOT COALESCE(NEW.auto_renew, false) THEN
    NEW.auto_renew_at := NULL;
  END IF;

  IF NEW.business_client_id IS NULL THEN
    seller_id := COALESCE(NEW.storefront_owner_id, NEW.created_by, NEW.user_id);
    resolved_client_id := COALESCE(NEW.client_id, NEW.user_id);

    IF seller_id IS NOT NULL AND resolved_client_id IS NOT NULL THEN
      INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
      SELECT seller_id, profile.id,
        COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
        profile.whatsapp, profile.email
      FROM public.profiles AS profile
      WHERE profile.id = resolved_client_id
      ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
      DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono, email = EXCLUDED.email
      RETURNING id INTO NEW.business_client_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_business_defaults ON public.orders;
CREATE TRIGGER orders_business_defaults
BEFORE INSERT OR UPDATE OF fecha_vencimiento, expires_at, business_client_id, created_by, client_id, storefront_owner_id, auto_renew, auto_renew_at
ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.business_orders_fill_defaults();

-- Reemplaza el checkout de catálogo para propagar perfil, vencimiento horario y
-- la planificación de autorrenovación sin confiar en cálculos del navegador.
CREATE OR REPLACE FUNCTION public.place_catalog_order_from_wallet(
  p_product_id uuid,
  p_client_id uuid,
  p_sale_price_pen numeric,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  order_id uuid,
  charged_pen numeric,
  charged_usd numeric,
  sale_price_pen numeric,
  profit_pen numeric,
  expires_on date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  product_row public.products%ROWTYPE;
  client_row public.business_clients%ROWTYPE;
  inventory_row public.account_inventory%ROWTYPE;
  created_order_id uuid;
  recipient_user_id uuid;
  wholesale_cost numeric(16, 6);
  current_balance numeric(16, 6);
  debit_amount numeric(16, 6);
  normalized_sale_price numeric(16, 2);
  margin_amount numeric(16, 2);
  default_markup_percent numeric(7, 3) := 20;
  pen_per_usd_setting numeric(12, 6) := 3.700000;
  expiration_date date;
  expiration_timestamp timestamptz;
  can_resell boolean := false;
  is_admin boolean := false;
  enable_auto_renew boolean := false;
BEGIN
  IF actor_id IS NULL OR p_client_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and a client are required to place a catalog order';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  can_resell := is_admin OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  SELECT * INTO client_row FROM public.business_clients WHERE id = p_client_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'The selected client does not exist'; END IF;
  IF (NOT is_admin AND client_row.owner_id IS DISTINCT FROM actor_id)
    OR (NOT can_resell AND client_row.profile_id IS DISTINCT FROM actor_id) THEN
    RAISE EXCEPTION 'You cannot assign orders to this client';
  END IF;

  SELECT * INTO product_row FROM public.products
  WHERE id = p_product_id AND COALESCE(is_active, true) AND COALESCE(is_catalog_available, true)
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product is not available'; END IF;

  SELECT COALESCE(cost.unit_cost_pen, product_row.price) INTO wholesale_cost
  FROM public.catalog_product_costs AS cost WHERE cost.product_id = p_product_id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);

  SELECT settings.default_markup_percent, settings.pen_per_usd
  INTO default_markup_percent, pen_per_usd_setting
  FROM public.catalog_pricing_settings AS settings WHERE settings.id = 'default';
  default_markup_percent := COALESCE(default_markup_percent, 20);
  pen_per_usd_setting := COALESCE(pen_per_usd_setting, 3.700000);

  IF can_resell THEN
    normalized_sale_price := round(COALESCE(p_sale_price_pen, 0), 2);
    IF normalized_sale_price < wholesale_cost THEN RAISE EXCEPTION 'Sale price must cover the product cost'; END IF;
    debit_amount := wholesale_cost;
  ELSE
    normalized_sale_price := GREATEST(round(product_row.price, 2), round(wholesale_cost * (1 + default_markup_percent / 100), 2));
    debit_amount := normalized_sale_price;
  END IF;

  SELECT * INTO inventory_row FROM public.account_inventory AS inventory
  WHERE inventory.product_id = p_product_id AND inventory.status IN ('available', 'disponible')
  ORDER BY inventory.created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'No stock available'; END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen) VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT saldo_pen INTO current_balance FROM public.wallet_balances WHERE user_id = actor_id FOR UPDATE;
  IF current_balance < debit_amount THEN RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order'; END IF;

  expiration_timestamp := CASE
    WHEN product_row.duration_days IS NULL OR product_row.duration_days <= 0 THEN NULL
    ELSE now() + make_interval(days => product_row.duration_days)
  END;
  expiration_date := (expiration_timestamp AT TIME ZONE 'America/Lima')::date;
  enable_auto_renew := COALESCE(p_auto_renew, false)
    AND COALESCE(product_row.is_renewable, true)
    AND expiration_timestamp IS NOT NULL;
  margin_amount := round(normalized_sale_price - wholesale_cost, 2);
  recipient_user_id := COALESCE(client_row.profile_id, actor_id);

  INSERT INTO public.orders (
    user_id, created_by, client_id, business_client_id, producto_id, producto_nombre, precio,
    unit_cost_pen, cost_total_pen, sale_price_pen, profit_pen, auto_renew, auto_renew_at,
    fecha_vencimiento, expires_at, estado, payment_verified
  ) VALUES (
    recipient_user_id, actor_id, client_row.profile_id, client_row.id, p_product_id::text,
    product_row.name, normalized_sale_price, wholesale_cost, debit_amount, normalized_sale_price,
    margin_amount, enable_auto_renew,
    CASE WHEN enable_auto_renew THEN GREATEST(now(), expiration_timestamp - interval '3 days') ELSE NULL END,
    expiration_date, expiration_timestamp, 'entregado', true
  ) RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = created_order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_row.id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes, profile)
  VALUES (created_order_id, recipient_user_id, inventory_row.email, inventory_row.password,
    inventory_row.access_link, inventory_row.notes, inventory_row.profile);

  UPDATE public.wallet_balances SET saldo_pen = saldo_pen - debit_amount WHERE user_id = actor_id;
  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description
  ) VALUES (
    actor_id, -debit_amount, current_balance - debit_amount, 'catalog_order_cost', created_order_id,
    CASE WHEN can_resell THEN 'Costo de pedido de catálogo para cliente CRM' ELSE 'Compra de catálogo' END
  );

  RETURN QUERY SELECT created_order_id, debit_amount, round(debit_amount / pen_per_usd_setting, 2),
    normalized_sale_price, margin_amount, expiration_date;
END;
$$;

-- La migración previa ya publicó get_business_order_rows(text). PostgreSQL no
-- permite cambiar sus columnas OUT mediante CREATE OR REPLACE; mantenemos esa
-- API para consumidores existentes y exponemos una variante segura con los
-- campos de automatización.
CREATE OR REPLACE FUNCTION public.get_business_order_rows_with_automation(p_scope text DEFAULT 'mine')
RETURNS TABLE(
  order_id uuid, source text, seller_id uuid, business_client_id uuid, client_profile_id uuid,
  product_id text, product_name text, product_image_url text, account_reference text,
  client_name text, client_phone text, client_avatar_url text, brand text,
  created_at timestamptz, expires_at timestamptz, business_status text, technical_status text,
  display_status text, cost_price numeric, sale_price numeric, profit numeric,
  is_renewable boolean, auto_renew boolean, auto_renew_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE actor_id uuid := auth.uid(); is_admin boolean := false;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required to view business orders'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view business orders';
  END IF;
  IF p_scope NOT IN ('mine', 'all') THEN RAISE EXCEPTION 'Invalid business order scope'; END IF;
  IF p_scope = 'all' AND NOT is_admin THEN RAISE EXCEPTION 'Only administrators can view all business orders'; END IF;

  RETURN QUERY
  WITH base_rows AS (
    SELECT order_row.id, 'catalog'::text, COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id),
      order_row.business_client_id, client.profile_id, order_row.producto_id, order_row.producto_nombre,
      product.image_url, order_row.account_reference,
      COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
      COALESCE(client.telefono, profile.whatsapp), profile.avatar_url,
      COALESCE(NULLIF(product.category, ''), 'Catálogo'), order_row.created_at, order_row.expires_at,
      order_row.business_status, order_row.estado, COALESCE(product.is_renewable, false),
      COALESCE(order_row.auto_renew, false), order_row.auto_renew_at,
      order_row.unit_cost_pen, order_row.sale_price_pen, order_row.profit_pen
    FROM public.orders AS order_row
    LEFT JOIN public.business_clients AS client ON client.id = order_row.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, order_row.client_id, order_row.user_id)
    LEFT JOIN public.products AS product ON product.id::text = order_row.producto_id
    WHERE (p_scope = 'all' AND is_admin) OR COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id) = actor_id
    UNION ALL
    SELECT social_order.id, 'social'::text, social_order.created_by, social_order.business_client_id,
      client.profile_id, social_order.service_id::text, social_order.service_name, NULL::text,
      social_order.target_url, COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
      COALESCE(client.telefono, profile.whatsapp), profile.avatar_url, COALESCE(NULLIF(social_order.platform, ''), 'Redes Sociales'),
      social_order.created_at, social_order.expires_at, social_order.business_status, social_order.status,
      false, false, NULL::timestamptz, social_order.unit_cost_pen, social_order.sale_price_pen, social_order.profit_pen
    FROM public.social_service_orders AS social_order
    LEFT JOIN public.business_clients AS client ON client.id = social_order.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, social_order.client_id)
    WHERE (p_scope = 'all' AND is_admin) OR social_order.created_by = actor_id
  )
  SELECT id, source, seller_id, business_client_id, profile_id, producto_id, producto_nombre, image_url,
    account_reference, client_name, client_phone, avatar_url, brand, created_at, expires_at,
    business_status, estado,
    CASE
      WHEN business_status <> 'en_curso' THEN business_status
      WHEN source = 'social' AND lower(estado) IN ('completed', 'completado') THEN 'completado'
      WHEN source = 'social' AND lower(estado) IN ('failed', 'failure', 'cancelled', 'canceled', 'cancelado') THEN 'cancelado'
      WHEN expires_at IS NULL THEN 'en_curso'
      WHEN expires_at <= now() THEN 'vencido'
      WHEN expires_at <= now() + interval '3 days' THEN 'por_vencer'
      ELSE 'en_curso'
    END,
    COALESCE(unit_cost_pen, 0), COALESCE(sale_price_pen, 0), COALESCE(profit_pen, 0),
    is_renewable, auto_renew, auto_renew_at
  FROM base_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_orders_with_automation(
  p_scope text DEFAULT 'mine', p_search text DEFAULT NULL, p_brand text DEFAULT NULL,
  p_month integer DEFAULT NULL, p_year integer DEFAULT NULL, p_status text DEFAULT NULL,
  p_limit integer DEFAULT 25, p_offset integer DEFAULT 0
)
RETURNS TABLE(
  order_id uuid, source text, seller_id uuid, business_client_id uuid, client_profile_id uuid,
  product_id text, product_name text, product_image_url text, account_reference text,
  client_name text, client_phone text, client_avatar_url text, brand text, created_at timestamptz,
  expires_at timestamptz, display_status text, cost_price numeric, sale_price numeric, profit numeric,
  is_renewable boolean, auto_renew boolean, auto_renew_at timestamptz, total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH filtered AS (
    SELECT * FROM public.get_business_order_rows_with_automation(p_scope)
    WHERE (NULLIF(btrim(p_search), '') IS NULL OR product_name ILIKE '%' || btrim(p_search) || '%'
      OR client_name ILIKE '%' || btrim(p_search) || '%' OR COALESCE(account_reference, '') ILIKE '%' || btrim(p_search) || '%')
      AND (NULLIF(btrim(p_brand), '') IS NULL OR lower(brand) = lower(btrim(p_brand)))
      AND (p_month IS NULL OR EXTRACT(MONTH FROM created_at)::integer = p_month)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM created_at)::integer = p_year)
      AND (NULLIF(btrim(p_status), '') IS NULL OR p_status = 'all' OR display_status = p_status)
  )
  SELECT order_id, source, seller_id, business_client_id, client_profile_id, product_id, product_name,
    product_image_url, account_reference, client_name, client_phone, client_avatar_url, brand, created_at,
    expires_at, display_status, cost_price, sale_price, profit, is_renewable, auto_renew, auto_renew_at,
    count(*) OVER ()
  FROM filtered ORDER BY created_at DESC, order_id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100) OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.set_business_order_auto_renew(p_order_id uuid, p_enabled boolean)
RETURNS TABLE(auto_renew boolean, auto_renew_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE actor_id uuid := auth.uid(); is_admin boolean := false; origin public.orders%ROWTYPE; is_renewable boolean;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can configure auto renewal';
  END IF;
  SELECT * INTO origin FROM public.orders
  WHERE id = p_order_id AND (is_admin OR COALESCE(storefront_owner_id, created_by, user_id) = actor_id)
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business order was not found or is not yours'; END IF;
  SELECT COALESCE(product.is_renewable, false) INTO is_renewable
  FROM public.products AS product WHERE product.id::text = origin.producto_id;
  IF COALESCE(p_enabled, false) AND NOT COALESCE(is_renewable, false) THEN RAISE EXCEPTION 'This product is not renewable'; END IF;
  IF COALESCE(p_enabled, false) AND origin.expires_at IS NULL THEN RAISE EXCEPTION 'This order has no expiration date'; END IF;

  UPDATE public.orders
  SET auto_renew = COALESCE(p_enabled, false),
      auto_renew_at = CASE WHEN COALESCE(p_enabled, false) THEN GREATEST(now(), origin.expires_at - interval '3 days') ELSE NULL END,
      auto_renew_last_error = NULL
  WHERE id = origin.id
  RETURNING orders.auto_renew, orders.auto_renew_at INTO auto_renew, auto_renew_at;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_order_status_counts_with_automation(
  p_scope text DEFAULT 'mine',
  p_search text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_year integer DEFAULT NULL
)
RETURNS TABLE(
  all_count bigint,
  en_curso_count bigint,
  completado_count bigint,
  interesado_count bigint,
  por_vencer_count bigint,
  vencido_count bigint,
  cancelado_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH filtered AS (
    SELECT *
    FROM public.get_business_order_rows_with_automation(p_scope)
    WHERE (NULLIF(btrim(p_search), '') IS NULL
      OR product_name ILIKE '%' || btrim(p_search) || '%'
      OR client_name ILIKE '%' || btrim(p_search) || '%'
      OR COALESCE(account_reference, '') ILIKE '%' || btrim(p_search) || '%')
      AND (NULLIF(btrim(p_brand), '') IS NULL OR lower(brand) = lower(btrim(p_brand)))
      AND (p_month IS NULL OR EXTRACT(MONTH FROM created_at)::integer = p_month)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM created_at)::integer = p_year)
  )
  SELECT
    count(*)::bigint,
    count(*) FILTER (WHERE display_status = 'en_curso')::bigint,
    count(*) FILTER (WHERE display_status = 'completado')::bigint,
    count(*) FILTER (WHERE display_status = 'interesado')::bigint,
    count(*) FILTER (WHERE display_status = 'por_vencer')::bigint,
    count(*) FILTER (WHERE display_status = 'vencido')::bigint,
    count(*) FILTER (WHERE display_status = 'cancelado')::bigint
  FROM filtered;
$$;

CREATE OR REPLACE FUNCTION public.get_business_order_credentials(p_order_id uuid)
RETURNS TABLE(email text, profile text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE actor_id uuid := auth.uid(); is_admin boolean := false; owner_id uuid; encryption_key text;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  SELECT COALESCE(storefront_owner_id, created_by, user_id) INTO owner_id FROM public.orders WHERE id = p_order_id;
  IF owner_id IS NULL OR (NOT is_admin AND owner_id IS DISTINCT FROM actor_id) THEN
    RAISE EXCEPTION 'Credentials are not available for this order';
  END IF;
  encryption_key := private.business_order_credentials_key();
  RETURN QUERY
  SELECT
    CASE WHEN credential.email_ciphertext IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(credential.email_ciphertext, encryption_key) END,
    CASE WHEN credential.profile_ciphertext IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(credential.profile_ciphertext, encryption_key) END
  FROM public.business_order_credentials AS credential
  WHERE credential.order_id = p_order_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.business_order_ticket_links (
  ticket_id uuid PRIMARY KEY REFERENCES public.tickets(id) ON DELETE CASCADE,
  order_source text NOT NULL CHECK (order_source IN ('catalog', 'social')),
  catalog_order_id uuid NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  social_order_id uuid NULL REFERENCES public.social_service_orders(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_client_id uuid NULL REFERENCES public.business_clients(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((order_source = 'catalog' AND catalog_order_id IS NOT NULL AND social_order_id IS NULL)
    OR (order_source = 'social' AND social_order_id IS NOT NULL AND catalog_order_id IS NULL))
);

CREATE INDEX IF NOT EXISTS business_order_ticket_links_catalog_idx ON public.business_order_ticket_links (catalog_order_id);
CREATE INDEX IF NOT EXISTS business_order_ticket_links_social_idx ON public.business_order_ticket_links (social_order_id);
ALTER TABLE public.business_order_ticket_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_order_ticket_links FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.business_order_ticket_links TO service_role;

CREATE OR REPLACE FUNCTION public.create_business_order_ticket(p_source text, p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE actor_id uuid := auth.uid(); order_row record; existing_ticket uuid; created_ticket uuid;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  SELECT * INTO order_row FROM public.get_business_order_rows_with_automation(
    CASE WHEN public.has_role(actor_id, 'admin'::public.app_role) THEN 'all' ELSE 'mine' END
  ) WHERE source = p_source AND order_id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business order was not found or is not yours'; END IF;

  SELECT link.ticket_id INTO existing_ticket
  FROM public.business_order_ticket_links AS link
  JOIN public.tickets AS ticket ON ticket.id = link.ticket_id
  WHERE link.order_source = p_source
    AND ((p_source = 'catalog' AND link.catalog_order_id = p_order_id) OR (p_source = 'social' AND link.social_order_id = p_order_id))
    AND link.seller_id = actor_id
    AND ticket.estado <> 'cerrado'::public.ticket_status
  ORDER BY link.created_at DESC LIMIT 1;
  IF existing_ticket IS NOT NULL THEN RETURN existing_ticket; END IF;

  INSERT INTO public.tickets (user_id, asunto, categoria, descripcion)
  VALUES (
    actor_id,
    left(format('Soporte · %s', order_row.product_name), 140),
    'producto_cuenta'::public.ticket_category,
    format(E'Pedido #%s\nProducto: %s\nCliente: %s\n\nDescribe el caso que necesitas resolver.', left(order_row.order_id::text, 8), order_row.product_name, order_row.client_name)
  ) RETURNING id INTO created_ticket;

  INSERT INTO public.business_order_ticket_links (
    ticket_id, order_source, catalog_order_id, social_order_id, seller_id, business_client_id
  ) VALUES (
    created_ticket, p_source,
    CASE WHEN p_source = 'catalog' THEN p_order_id ELSE NULL END,
    CASE WHEN p_source = 'social' THEN p_order_id ELSE NULL END,
    actor_id, order_row.business_client_id
  );
  RETURN created_ticket;
END;
$$;

-- El proceso se ejecuta desde una ruta de cron autenticada con service role. Reutiliza
-- el checkout transaccional para bloquear inventario y billetera antes de crear el ciclo.
CREATE OR REPLACE FUNCTION public.process_due_auto_renewals(p_limit integer DEFAULT 50)
RETURNS TABLE(order_id uuid, renewed_order_id uuid, result text, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE due_order public.orders%ROWTYPE; created_order uuid; previous_claim text; recipient_profile_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Only service role can process automatic renewals';
  END IF;
  previous_claim := current_setting('request.jwt.claim.sub', true);
  FOR due_order IN
    SELECT order_row.* FROM public.orders AS order_row
    JOIN public.products AS product ON product.id::text = order_row.producto_id
    WHERE order_row.auto_renew IS TRUE AND order_row.auto_renew_at IS NOT NULL
      AND order_row.auto_renew_at <= now() AND order_row.business_status = 'en_curso'
      AND COALESCE(product.is_renewable, false) AND COALESCE(product.is_active, true)
    ORDER BY order_row.auto_renew_at ASC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100)
    FOR UPDATE OF order_row SKIP LOCKED
  LOOP
    BEGIN
      IF due_order.business_client_id IS NULL OR due_order.created_by IS NULL THEN
        RAISE EXCEPTION 'Order has no renewable seller or client';
      END IF;
      PERFORM set_config('request.jwt.claim.sub', due_order.created_by::text, true);
      SELECT placed.order_id INTO created_order
      FROM public.place_catalog_order_from_wallet(
        due_order.producto_id::uuid, due_order.business_client_id,
        COALESCE(due_order.sale_price_pen, due_order.precio), true
      ) AS placed;
      UPDATE public.orders
      SET renewed_from_order_id = due_order.id
      WHERE id = created_order;
      UPDATE public.orders
      SET business_status = 'completado', auto_renew = false, auto_renew_at = NULL,
          auto_renew_last_attempt_at = now(), auto_renew_last_error = NULL
      WHERE id = due_order.id;
      SELECT profile_id INTO recipient_profile_id
      FROM public.business_clients
      WHERE id = due_order.business_client_id;
      IF recipient_profile_id IS NOT NULL THEN
        INSERT INTO public.business_order_notifications (
          seller_id, business_client_id, recipient_profile_id, order_source, order_id, title, body
        ) VALUES (
          due_order.created_by, due_order.business_client_id, recipient_profile_id, 'catalog', created_order,
          'Pedido renovado automáticamente',
          format('Tu servicio %s fue renovado correctamente.', due_order.producto_nombre)
        );
      END IF;
      order_id := due_order.id; renewed_order_id := created_order; result := 'renewed'; detail := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.orders
      SET auto_renew_last_attempt_at = now(), auto_renew_last_error = left(SQLERRM, 500),
          auto_renew_at = now() + interval '6 hours'
      WHERE id = due_order.id;
      order_id := due_order.id; renewed_order_id := NULL; result := 'retry_scheduled'; detail := left(SQLERRM, 500);
      RETURN NEXT;
    END;
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub', COALESCE(previous_claim, ''), true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_business_order_rows_with_automation(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_business_orders_with_automation(text, text, text, integer, integer, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_order_status_counts_with_automation(text, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_business_order_auto_renew(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_order_credentials(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_business_order_ticket(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_due_auto_renewals(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_business_orders_with_automation(text, text, text, integer, integer, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_business_order_status_counts_with_automation(text, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_business_order_auto_renew(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_business_order_credentials(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_business_order_ticket(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_due_auto_renewals(integer) TO service_role;
