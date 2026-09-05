-- Panel comercial "Mis Pedidos".
-- Reutiliza los pedidos de catálogo y SMM existentes; no duplica ventas ni credenciales.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS business_status text NOT NULL DEFAULT 'en_curso',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS account_reference text NULL,
  ADD COLUMN IF NOT EXISTS renewed_from_order_id uuid NULL REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_business_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_business_status_check
  CHECK (business_status IN ('en_curso', 'completado', 'interesado', 'cancelado'));

ALTER TABLE public.social_service_orders
  ADD COLUMN IF NOT EXISTS business_status text NOT NULL DEFAULT 'en_curso',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

ALTER TABLE public.social_service_orders
  DROP CONSTRAINT IF EXISTS social_service_orders_business_status_check;
ALTER TABLE public.social_service_orders
  ADD CONSTRAINT social_service_orders_business_status_check
  CHECK (business_status IN ('en_curso', 'completado', 'interesado', 'cancelado'));

CREATE INDEX IF NOT EXISTS orders_business_dashboard_idx
  ON public.orders (created_by, expires_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_storefront_owner_dashboard_idx
  ON public.orders (storefront_owner_id, expires_at DESC, created_at DESC)
  WHERE storefront_owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS social_service_orders_business_dashboard_idx
  ON public.social_service_orders (created_by, created_at DESC);

-- El modelo anterior guardaba una fecha, no una hora. Para el historial se
-- interpreta como el final del día en Lima y las nuevas ventas continúan
-- siendo compatibles con fecha_vencimiento.
UPDATE public.orders
SET expires_at = ((fecha_vencimiento::timestamp + time '23:59:59') AT TIME ZONE 'America/Lima')
WHERE expires_at IS NULL
  AND fecha_vencimiento IS NOT NULL;

CREATE OR REPLACE FUNCTION public.business_orders_fill_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seller_id uuid;
  resolved_client_id uuid;
BEGIN
  IF NEW.business_status IS NULL THEN
    NEW.business_status := 'en_curso';
  END IF;

  IF NEW.expires_at IS NULL AND NEW.fecha_vencimiento IS NOT NULL THEN
    NEW.expires_at := ((NEW.fecha_vencimiento::timestamp + time '23:59:59') AT TIME ZONE 'America/Lima');
  END IF;

  -- Las compras públicas no tenían cliente CRM. Se enlazan automáticamente
  -- a la cartera del dueño de tienda para que aparezcan en Mis Pedidos.
  IF NEW.business_client_id IS NULL THEN
    seller_id := COALESCE(NEW.storefront_owner_id, NEW.created_by, NEW.user_id);
    resolved_client_id := COALESCE(NEW.client_id, NEW.user_id);

    IF seller_id IS NOT NULL AND resolved_client_id IS NOT NULL THEN
      INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
      SELECT
        seller_id,
        profile.id,
        COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
        profile.whatsapp,
        profile.email
      FROM public.profiles AS profile
      WHERE profile.id = resolved_client_id
      ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
      DO UPDATE SET
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        email = EXCLUDED.email
      RETURNING id INTO NEW.business_client_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_business_defaults ON public.orders;
CREATE TRIGGER orders_business_defaults
BEFORE INSERT OR UPDATE OF fecha_vencimiento, expires_at, business_client_id, created_by, client_id, storefront_owner_id
ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.business_orders_fill_defaults();

-- Corrige ventas públicas históricas: el dueño de storefront administra el cliente CRM.
INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
SELECT DISTINCT order_row.storefront_owner_id, profile.id,
  COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
  profile.whatsapp, profile.email
FROM public.orders AS order_row
JOIN public.profiles AS profile ON profile.id = COALESCE(order_row.client_id, order_row.user_id)
WHERE order_row.storefront_owner_id IS NOT NULL
ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono, email = EXCLUDED.email;

UPDATE public.orders AS order_row
SET business_client_id = client.id
FROM public.business_clients AS client
WHERE order_row.storefront_owner_id IS NOT NULL
  AND client.owner_id = order_row.storefront_owner_id
  AND client.profile_id = COALESCE(order_row.client_id, order_row.user_id);

CREATE OR REPLACE FUNCTION public.business_orders_sync_account_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.orders
  SET account_reference = COALESCE(NULLIF(NEW.email, ''), NULLIF(NEW.access_link, ''), account_reference)
  WHERE id = NEW.order_id
    AND account_reference IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivered_accounts_business_reference ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_business_reference
AFTER INSERT OR UPDATE OF email, access_link ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION public.business_orders_sync_account_reference();

UPDATE public.orders AS order_row
SET account_reference = COALESCE(NULLIF(delivery.email, ''), NULLIF(delivery.access_link, ''))
FROM (
  SELECT DISTINCT ON (order_id) order_id, email, access_link
  FROM public.delivered_accounts
  ORDER BY order_id, created_at ASC NULLS LAST
) AS delivery
WHERE order_row.id = delivery.order_id
  AND order_row.account_reference IS NULL;

CREATE TABLE IF NOT EXISTS public.business_order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_client_id uuid NULL REFERENCES public.business_clients(id) ON DELETE SET NULL,
  recipient_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_source text NOT NULL CHECK (order_source IN ('catalog', 'social')),
  order_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 180),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  read_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_order_notifications_recipient_idx
  ON public.business_order_notifications (recipient_profile_id, created_at DESC)
  WHERE recipient_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS business_order_notifications_seller_idx
  ON public.business_order_notifications (seller_id, created_at DESC);

ALTER TABLE public.business_order_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_order_notifications FROM anon;
GRANT SELECT, UPDATE ON public.business_order_notifications TO authenticated;
GRANT ALL ON public.business_order_notifications TO service_role;

DROP POLICY IF EXISTS "Recipients read their business order notifications" ON public.business_order_notifications;
CREATE POLICY "Recipients read their business order notifications"
ON public.business_order_notifications FOR SELECT TO authenticated
USING (recipient_profile_id = auth.uid());

DROP POLICY IF EXISTS "Recipients mark their business order notifications read" ON public.business_order_notifications;
CREATE POLICY "Recipients mark their business order notifications read"
ON public.business_order_notifications FOR UPDATE TO authenticated
USING (recipient_profile_id = auth.uid())
WITH CHECK (recipient_profile_id = auth.uid());

DROP POLICY IF EXISTS "Commercial owners read their business order notifications" ON public.business_order_notifications;
CREATE POLICY "Commercial owners read their business order notifications"
ON public.business_order_notifications FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR seller_id = auth.uid()
);

-- Base normalizada. Los permisos se comprueban antes de consultar tablas
-- internas, de modo que el cliente nunca recibe costos ni pedidos ajenos.
CREATE OR REPLACE FUNCTION public.get_business_order_rows(p_scope text DEFAULT 'mine')
RETURNS TABLE(
  order_id uuid,
  source text,
  seller_id uuid,
  business_client_id uuid,
  client_profile_id uuid,
  product_id text,
  product_name text,
  product_image_url text,
  account_reference text,
  client_name text,
  client_phone text,
  client_avatar_url text,
  brand text,
  created_at timestamptz,
  expires_at timestamptz,
  business_status text,
  technical_status text,
  display_status text,
  cost_price numeric,
  sale_price numeric,
  profit numeric,
  is_renewable boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  is_admin boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view business orders';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view business orders';
  END IF;
  IF p_scope NOT IN ('mine', 'all') THEN
    RAISE EXCEPTION 'Invalid business order scope';
  END IF;
  IF p_scope = 'all' AND NOT is_admin THEN
    RAISE EXCEPTION 'Only administrators can view all business orders';
  END IF;

  RETURN QUERY
  WITH base_rows AS (
    SELECT
      order_row.id AS order_id,
      'catalog'::text AS source,
      COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id) AS seller_id,
      order_row.business_client_id,
      client.profile_id AS client_profile_id,
      order_row.producto_id,
      order_row.producto_nombre,
      product.image_url AS product_image_url,
      COALESCE(order_row.account_reference, delivery.email, delivery.access_link) AS account_reference,
      COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente') AS client_name,
      COALESCE(client.telefono, profile.whatsapp) AS client_phone,
      profile.avatar_url AS client_avatar_url,
      COALESCE(NULLIF(product.category, ''), 'Catálogo') AS brand,
      order_row.created_at,
      order_row.expires_at,
      order_row.business_status,
      order_row.estado AS technical_status,
      COALESCE(product.is_renewable, false) AS is_renewable
    FROM public.orders AS order_row
    LEFT JOIN public.business_clients AS client ON client.id = order_row.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, order_row.client_id, order_row.user_id)
    LEFT JOIN public.products AS product ON product.id::text = order_row.producto_id
    LEFT JOIN LATERAL (
      SELECT account.email, account.access_link
      FROM public.delivered_accounts AS account
      WHERE account.order_id = order_row.id
      ORDER BY account.created_at ASC NULLS LAST
      LIMIT 1
    ) AS delivery ON true
    WHERE (p_scope = 'all' AND is_admin)
      OR COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id) = actor_id

    UNION ALL

    SELECT
      social_order.id AS order_id,
      'social'::text AS source,
      social_order.created_by AS seller_id,
      social_order.business_client_id,
      client.profile_id AS client_profile_id,
      social_order.service_id::text AS product_id,
      social_order.service_name AS product_name,
      NULL::text AS product_image_url,
      social_order.target_url AS account_reference,
      COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente') AS client_name,
      COALESCE(client.telefono, profile.whatsapp) AS client_phone,
      profile.avatar_url AS client_avatar_url,
      COALESCE(NULLIF(social_order.platform, ''), 'Redes Sociales') AS brand,
      social_order.created_at,
      social_order.expires_at,
      social_order.business_status,
      social_order.status AS technical_status,
      false AS is_renewable
    FROM public.social_service_orders AS social_order
    LEFT JOIN public.business_clients AS client ON client.id = social_order.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, social_order.client_id)
    WHERE (p_scope = 'all' AND is_admin) OR social_order.created_by = actor_id
  )
  SELECT
    base_rows.order_id,
    base_rows.source,
    base_rows.seller_id,
    base_rows.business_client_id,
    base_rows.client_profile_id,
    base_rows.product_id,
    base_rows.product_name,
    base_rows.product_image_url,
    base_rows.account_reference,
    base_rows.client_name,
    base_rows.client_phone,
    base_rows.client_avatar_url,
    base_rows.brand,
    base_rows.created_at,
    base_rows.expires_at,
    base_rows.business_status,
    base_rows.technical_status,
    CASE
      WHEN base_rows.business_status <> 'en_curso' THEN base_rows.business_status
      WHEN base_rows.source = 'social' AND lower(base_rows.technical_status) IN ('completed', 'completado') THEN 'completado'
      WHEN base_rows.source = 'social' AND lower(base_rows.technical_status) IN ('failed', 'failure', 'cancelled', 'canceled', 'cancelado') THEN 'cancelado'
      WHEN base_rows.expires_at IS NULL THEN 'en_curso'
      WHEN base_rows.expires_at <= now() THEN 'vencido'
      WHEN base_rows.expires_at <= now() + interval '5 days' THEN 'por_vencer'
      ELSE 'en_curso'
    END AS display_status,
    CASE WHEN base_rows.source = 'catalog' THEN COALESCE((SELECT unit_cost_pen FROM public.orders WHERE id = base_rows.order_id), 0) ELSE COALESCE((SELECT unit_cost_pen FROM public.social_service_orders WHERE id = base_rows.order_id), 0) END AS cost_price,
    CASE WHEN base_rows.source = 'catalog' THEN COALESCE((SELECT sale_price_pen FROM public.orders WHERE id = base_rows.order_id), 0) ELSE COALESCE((SELECT sale_price_pen FROM public.social_service_orders WHERE id = base_rows.order_id), 0) END AS sale_price,
    CASE WHEN base_rows.source = 'catalog' THEN COALESCE((SELECT profit_pen FROM public.orders WHERE id = base_rows.order_id), 0) ELSE COALESCE((SELECT profit_pen FROM public.social_service_orders WHERE id = base_rows.order_id), 0) END AS profit,
    base_rows.is_renewable
  FROM base_rows;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_orders(
  p_scope text DEFAULT 'mine',
  p_search text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_month integer DEFAULT NULL,
  p_year integer DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  order_id uuid,
  source text,
  seller_id uuid,
  business_client_id uuid,
  client_profile_id uuid,
  product_id text,
  product_name text,
  product_image_url text,
  account_reference text,
  client_name text,
  client_phone text,
  client_avatar_url text,
  brand text,
  created_at timestamptz,
  expires_at timestamptz,
  display_status text,
  cost_price numeric,
  sale_price numeric,
  profit numeric,
  is_renewable boolean,
  total_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH filtered AS (
    SELECT *
    FROM public.get_business_order_rows(p_scope)
    WHERE (NULLIF(btrim(p_search), '') IS NULL
      OR product_name ILIKE '%' || btrim(p_search) || '%'
      OR client_name ILIKE '%' || btrim(p_search) || '%'
      OR COALESCE(account_reference, '') ILIKE '%' || btrim(p_search) || '%')
      AND (NULLIF(btrim(p_brand), '') IS NULL OR lower(brand) = lower(btrim(p_brand)))
      AND (p_month IS NULL OR EXTRACT(MONTH FROM created_at)::integer = p_month)
      AND (p_year IS NULL OR EXTRACT(YEAR FROM created_at)::integer = p_year)
      AND (NULLIF(btrim(p_status), '') IS NULL OR p_status = 'all' OR display_status = p_status)
  )
  SELECT
    order_id, source, seller_id, business_client_id, client_profile_id, product_id, product_name,
    product_image_url, account_reference, client_name, client_phone, client_avatar_url, brand,
    created_at, expires_at, display_status, cost_price, sale_price, profit, is_renewable,
    count(*) OVER () AS total_count
  FROM filtered
  ORDER BY created_at DESC, order_id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 25), 1), 100)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_business_order_status_counts(
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
    FROM public.get_business_order_rows(p_scope)
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

CREATE OR REPLACE FUNCTION public.set_business_order_status(
  p_source text,
  p_order_id uuid,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  is_admin boolean := false;
  updated_count integer := 0;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can manage business orders';
  END IF;
  IF p_status NOT IN ('en_curso', 'completado', 'interesado', 'cancelado') THEN
    RAISE EXCEPTION 'Invalid manual business order status';
  END IF;

  IF p_source = 'catalog' THEN
    UPDATE public.orders
    SET business_status = p_status
    WHERE id = p_order_id
      AND (is_admin OR COALESCE(storefront_owner_id, created_by, user_id) = actor_id);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSIF p_source = 'social' THEN
    UPDATE public.social_service_orders
    SET business_status = p_status
    WHERE id = p_order_id AND (is_admin OR created_by = actor_id);
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Invalid business order source';
  END IF;
  IF updated_count <> 1 THEN RAISE EXCEPTION 'Business order was not found or is not yours'; END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.renew_business_catalog_order(p_order_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  is_admin boolean := false;
  origin public.orders%ROWTYPE;
  client_id uuid;
  renewed_id uuid;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can renew business orders';
  END IF;

  SELECT * INTO origin
  FROM public.orders
  WHERE id = p_order_id
    AND (is_admin OR COALESCE(storefront_owner_id, created_by, user_id) = actor_id)
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business order was not found or is not yours'; END IF;

  client_id := origin.business_client_id;
  IF client_id IS NULL THEN
    INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
    SELECT actor_id, profile.id,
      COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
      profile.whatsapp, profile.email
    FROM public.profiles AS profile
    WHERE profile.id = COALESCE(origin.client_id, origin.user_id)
    ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
    DO UPDATE SET updated_at = now()
    RETURNING id INTO client_id;
  END IF;
  IF client_id IS NULL THEN RAISE EXCEPTION 'The order has no renewable client'; END IF;

  SELECT order_id INTO renewed_id
  FROM public.place_catalog_order_from_wallet(
    origin.producto_id::uuid,
    client_id,
    COALESCE(origin.sale_price_pen, origin.precio),
    COALESCE(origin.auto_renew, false)
  );

  UPDATE public.orders SET renewed_from_order_id = origin.id WHERE id = renewed_id;
  UPDATE public.orders SET business_status = 'completado' WHERE id = origin.id;
  RETURN renewed_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_business_order_client(
  p_source text,
  p_order_id uuid
)
RETURNS TABLE(whatsapp text, message text, recorded_internal boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  order_row record;
  internal_recorded boolean := false;
  notification_title text;
  notification_body text;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required'; END IF;

  SELECT * INTO order_row
  FROM public.get_business_order_rows(
    CASE WHEN public.has_role(actor_id, 'admin'::public.app_role) THEN 'all' ELSE 'mine' END
  )
  WHERE source = p_source AND order_id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business order was not found or is not yours'; END IF;

  notification_title := format('Actualización de tu pedido: %s', order_row.product_name);
  notification_body := format('Tu pedido %s se encuentra %s.', order_row.product_name, replace(order_row.display_status, '_', ' '));

  IF order_row.client_profile_id IS NOT NULL THEN
    INSERT INTO public.business_order_notifications (
      seller_id, business_client_id, recipient_profile_id, order_source, order_id, title, body
    ) VALUES (
      order_row.seller_id, order_row.business_client_id, order_row.client_profile_id,
      order_row.source, order_row.order_id, notification_title, notification_body
    );
    internal_recorded := true;
  END IF;

  RETURN QUERY SELECT order_row.client_phone, notification_body, internal_recorded;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_business_order_notifications()
RETURNS TABLE(id uuid, title text, body text, created_at timestamptz, read_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT notification.id, notification.title, notification.body, notification.created_at, notification.read_at
  FROM public.business_order_notifications AS notification
  WHERE notification.recipient_profile_id = auth.uid()
  ORDER BY notification.created_at DESC
  LIMIT 30;
$$;

REVOKE ALL ON FUNCTION public.get_business_order_rows(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_business_orders(text, text, text, integer, integer, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_order_status_counts(text, text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_business_order_status(text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.renew_business_catalog_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.notify_business_order_client(text, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_business_order_notifications() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_business_orders(text, text, text, integer, integer, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_business_order_status_counts(text, text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_business_order_status(text, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.renew_business_catalog_order(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.notify_business_order_client(text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_business_order_notifications() TO authenticated, service_role;
