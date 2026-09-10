-- Entrega posterior a la compra: credenciales cifradas por pedido y enlaces
-- temporales de un único uso. Esta migración amplía la bóveda comercial creada
-- en 20260904140000_business_order_automation_credentials.sql sin borrar datos.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS credential_template text NOT NULL DEFAULT 'account';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_credential_template_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_credential_template_check
      CHECK (credential_template IN ('account', 'account_2fa', 'redeem_code', 'access_link', 'none'));
  END IF;
END;
$$;

COMMENT ON COLUMN public.products.credential_template IS
  'Delivery shape: account, account_2fa, redeem_code, access_link, or none.';

ALTER TABLE public.account_inventory
  ADD COLUMN IF NOT EXISTS two_factor_secret text NULL,
  ADD COLUMN IF NOT EXISTS backup_codes text NULL,
  ADD COLUMN IF NOT EXISTS redeem_code text NULL;

-- Los productos de canje o acceso por URL no tienen correo ni contraseña.
-- La validación de cuenta/2FA se conserva en los Server Functions según
-- products.credential_template; este cambio solo permite representarlos.
ALTER TABLE public.account_inventory
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN password DROP NOT NULL;

ALTER TABLE public.delivered_accounts
  ADD COLUMN IF NOT EXISTS two_factor_secret text NULL,
  ADD COLUMN IF NOT EXISTS backup_codes text NULL,
  ADD COLUMN IF NOT EXISTS redeem_code text NULL;

ALTER TABLE public.business_order_credentials
  ADD COLUMN IF NOT EXISTS password_ciphertext bytea NULL,
  ADD COLUMN IF NOT EXISTS two_factor_secret_ciphertext bytea NULL,
  ADD COLUMN IF NOT EXISTS backup_codes_ciphertext bytea NULL,
  ADD COLUMN IF NOT EXISTS redeem_code_ciphertext bytea NULL;

-- El checkout ya asigna primero el ítem de inventario al pedido y después crea
-- delivered_accounts. Este trigger completa los nuevos campos sin reescribir
-- la función de checkout ni cambiar el débito de billetera.
CREATE OR REPLACE FUNCTION private.fill_delivered_account_extended_credentials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF NEW.two_factor_secret IS NULL
    AND NEW.backup_codes IS NULL
    AND NEW.redeem_code IS NULL THEN
    SELECT inventory.two_factor_secret, inventory.backup_codes, inventory.redeem_code
    INTO NEW.two_factor_secret, NEW.backup_codes, NEW.redeem_code
    FROM public.account_inventory AS inventory
    WHERE inventory.order_id = NEW.order_id
    ORDER BY inventory.assigned_at DESC NULLS LAST, inventory.created_at DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivered_accounts_fill_extended_credentials ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_fill_extended_credentials
BEFORE INSERT ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION private.fill_delivered_account_extended_credentials();

-- La tabla cifrada es la fuente de lectura para las nuevas vistas. El inventario
-- y delivered_accounts conservan sus columnas legacy para no interrumpir los
-- flujos existentes de stock ni las entregas históricas.
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
    password_ciphertext,
    profile_ciphertext,
    two_factor_secret_ciphertext,
    backup_codes_ciphertext,
    redeem_code_ciphertext,
    updated_at
  ) VALUES (
    NEW.order_id,
    CASE WHEN NULLIF(btrim(NEW.email), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.email, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.password), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.password, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.profile), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.profile, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.two_factor_secret), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.two_factor_secret, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.backup_codes), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.backup_codes, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    CASE WHEN NULLIF(btrim(NEW.redeem_code), '') IS NULL THEN NULL
      ELSE extensions.pgp_sym_encrypt(NEW.redeem_code, encryption_key, 'cipher-algo=aes256, compress-algo=1') END,
    now()
  )
  ON CONFLICT (order_id) DO UPDATE
  SET email_ciphertext = EXCLUDED.email_ciphertext,
      password_ciphertext = EXCLUDED.password_ciphertext,
      profile_ciphertext = EXCLUDED.profile_ciphertext,
      two_factor_secret_ciphertext = EXCLUDED.two_factor_secret_ciphertext,
      backup_codes_ciphertext = EXCLUDED.backup_codes_ciphertext,
      redeem_code_ciphertext = EXCLUDED.redeem_code_ciphertext,
      updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delivered_accounts_sync_business_credentials ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_sync_business_credentials
AFTER INSERT OR UPDATE OF email, password, profile, two_factor_secret, backup_codes, redeem_code
ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION private.sync_business_order_credentials();

-- Cifra las entregas ya creadas; no altera ni elimina las fuentes legacy.
INSERT INTO public.business_order_credentials (
  order_id,
  email_ciphertext,
  password_ciphertext,
  profile_ciphertext,
  two_factor_secret_ciphertext,
  backup_codes_ciphertext,
  redeem_code_ciphertext,
  updated_at
)
SELECT DISTINCT ON (account.order_id)
  account.order_id,
  CASE WHEN NULLIF(btrim(account.email), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.email, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.password), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.password, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.profile), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.profile, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.two_factor_secret), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.two_factor_secret, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.backup_codes), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.backup_codes, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  CASE WHEN NULLIF(btrim(account.redeem_code), '') IS NULL THEN NULL
    ELSE extensions.pgp_sym_encrypt(account.redeem_code, private.business_order_credentials_key(), 'cipher-algo=aes256, compress-algo=1') END,
  now()
FROM public.delivered_accounts AS account
ORDER BY account.order_id, account.created_at ASC NULLS LAST
ON CONFLICT (order_id) DO UPDATE
SET email_ciphertext = EXCLUDED.email_ciphertext,
    password_ciphertext = EXCLUDED.password_ciphertext,
    profile_ciphertext = EXCLUDED.profile_ciphertext,
    two_factor_secret_ciphertext = EXCLUDED.two_factor_secret_ciphertext,
    backup_codes_ciphertext = EXCLUDED.backup_codes_ciphertext,
    redeem_code_ciphertext = EXCLUDED.redeem_code_ciphertext,
    updated_at = now();

-- Una única consulta privada evita que las vistas nuevas lean delivered_accounts
-- directamente. Solo las funciones autorizadas de abajo pueden invocarla.
CREATE OR REPLACE FUNCTION private.order_credential_payload(p_order_id uuid)
RETURNS TABLE(
  order_id uuid,
  product_name text,
  client_name text,
  client_phone text,
  expires_at timestamptz,
  credential_template text,
  supplier_name text,
  supplier_whatsapp text,
  email text,
  password text,
  profile text,
  two_factor_secret text,
  backup_codes text,
  redeem_code text,
  access_link text,
  notes text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
  SELECT
    order_row.id,
    order_row.producto_nombre,
    COALESCE(NULLIF(client.nombre, ''), NULLIF(client_profile.nombre_completo, ''), NULLIF(recipient.nombre_completo, ''), 'Cliente'),
    COALESCE(client.telefono, client_profile.whatsapp, recipient.whatsapp),
    COALESCE(
      order_row.expires_at,
      ((order_row.fecha_vencimiento::timestamp + time '23:59:59') AT TIME ZONE 'America/Lima')
    ),
    COALESCE(product.credential_template, 'account'),
    COALESCE(NULLIF(supplier.display_name, ''), NULLIF(supplier_profile.nombre_completo, ''), NULLIF(product.publisher_name, ''), 'CMD Streaming'),
    NULLIF(supplier_profile.whatsapp, ''),
    CASE WHEN credential.email_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.email_ciphertext, private.business_order_credentials_key()) END,
    CASE WHEN credential.password_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.password_ciphertext, private.business_order_credentials_key()) END,
    CASE WHEN credential.profile_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.profile_ciphertext, private.business_order_credentials_key()) END,
    CASE WHEN credential.two_factor_secret_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.two_factor_secret_ciphertext, private.business_order_credentials_key()) END,
    CASE WHEN credential.backup_codes_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.backup_codes_ciphertext, private.business_order_credentials_key()) END,
    CASE WHEN credential.redeem_code_ciphertext IS NULL THEN NULL
      ELSE extensions.pgp_sym_decrypt(credential.redeem_code_ciphertext, private.business_order_credentials_key()) END,
    delivery.access_link,
    delivery.notes
  FROM public.orders AS order_row
  LEFT JOIN public.products AS product ON product.id::text = order_row.producto_id
  LEFT JOIN public.business_clients AS client ON client.id = order_row.business_client_id
  LEFT JOIN public.profiles AS client_profile ON client_profile.id = client.profile_id
  LEFT JOIN public.profiles AS recipient ON recipient.id = order_row.user_id
  LEFT JOIN public.profiles AS supplier_profile ON supplier_profile.id = product.supplier_id
  LEFT JOIN public.supplier_profiles AS supplier ON supplier.user_id = product.supplier_id
  LEFT JOIN public.business_order_credentials AS credential ON credential.order_id = order_row.id
  LEFT JOIN LATERAL (
    SELECT account.access_link, account.notes
    FROM public.delivered_accounts AS account
    WHERE account.order_id = order_row.id
    ORDER BY account.created_at ASC NULLS LAST
    LIMIT 1
  ) AS delivery ON true
  WHERE order_row.id = p_order_id;
$$;

REVOKE ALL ON FUNCTION private.order_credential_payload(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_order_celebration_receipt(p_order_id uuid)
RETURNS TABLE(
  order_id uuid,
  product_name text,
  client_name text,
  client_phone text,
  expires_at timestamptz,
  credential_template text,
  supplier_name text,
  supplier_whatsapp text,
  email text,
  password text,
  profile text,
  two_factor_secret text,
  backup_codes text,
  redeem_code text,
  access_link text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  order_row public.orders%ROWTYPE;
  owner_id uuid;
  is_admin boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view credentials';
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order was not found';
  END IF;

  owner_id := COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id);
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);

  IF NOT is_admin AND actor_id IS DISTINCT FROM owner_id AND actor_id IS DISTINCT FROM order_row.user_id
    AND actor_id IS DISTINCT FROM order_row.client_id THEN
    RAISE EXCEPTION 'Credentials are not available for this order';
  END IF;

  RETURN QUERY SELECT * FROM private.order_credential_payload(p_order_id);
END;
$$;

CREATE TABLE IF NOT EXISTS public.order_credential_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token_digest bytea NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_credential_share_links_expiration_check CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS order_credential_share_links_active_idx
  ON public.order_credential_share_links (order_id, expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.order_credential_share_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_credential_share_links FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.order_credential_share_links TO service_role;

CREATE OR REPLACE FUNCTION public.create_order_credential_share_link(p_order_id uuid)
RETURNS TABLE(share_token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  owner_id uuid;
  is_admin boolean := false;
  can_resell boolean := false;
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
  token_expires_at timestamptz := now() + interval '15 minutes';
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to create a secure delivery link';
  END IF;

  SELECT COALESCE(storefront_owner_id, created_by, user_id)
  INTO owner_id
  FROM public.orders
  WHERE id = p_order_id;
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Order was not found';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  can_resell := is_admin
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  IF NOT is_admin AND (NOT can_resell OR owner_id IS DISTINCT FROM actor_id) THEN
    RAISE EXCEPTION 'Only the order owner can create a client delivery link';
  END IF;

  -- Un pedido mantiene un solo enlace pendiente para minimizar exposición.
  UPDATE public.order_credential_share_links
  SET expires_at = now()
  WHERE order_id = p_order_id AND consumed_at IS NULL AND expires_at > now();

  INSERT INTO public.order_credential_share_links (order_id, token_digest, created_by, expires_at)
  VALUES (p_order_id, extensions.digest(raw_token, 'sha256'), actor_id, token_expires_at);

  RETURN QUERY SELECT raw_token, token_expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_order_credential_share_link(p_token text)
RETURNS TABLE(
  order_id uuid,
  product_name text,
  client_name text,
  client_phone text,
  expires_at timestamptz,
  credential_template text,
  supplier_name text,
  supplier_whatsapp text,
  email text,
  password text,
  profile text,
  two_factor_secret text,
  backup_codes text,
  redeem_code text,
  access_link text,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, extensions, pg_temp
AS $$
DECLARE
  link_row public.order_credential_share_links%ROWTYPE;
BEGIN
  IF p_token IS NULL OR char_length(p_token) <> 64 OR p_token !~ '^[0-9a-f]+$' THEN
    RAISE EXCEPTION 'The secure delivery link is invalid or expired';
  END IF;

  SELECT * INTO link_row
  FROM public.order_credential_share_links
  WHERE token_digest = extensions.digest(p_token, 'sha256')
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The secure delivery link is invalid, expired, or has already been used';
  END IF;

  UPDATE public.order_credential_share_links
  SET consumed_at = now()
  WHERE id = link_row.id;

  RETURN QUERY SELECT * FROM private.order_credential_payload(link_row.order_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_order_celebration_receipt(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_order_credential_share_link(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_order_credential_share_link(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_order_celebration_receipt(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_order_credential_share_link(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_order_credential_share_link(text) TO anon, authenticated, service_role;
