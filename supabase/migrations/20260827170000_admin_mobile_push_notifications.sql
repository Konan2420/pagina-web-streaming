-- CMD Admin Notifier: mobile administration events and Expo push tokens.
-- The mobile application uses only the public Supabase key. All sensitive
-- authorization remains in RLS and SECURITY DEFINER database functions.

CREATE TABLE IF NOT EXISTS public.admin_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_push_tokens_user_active_idx
  ON public.admin_push_tokens (user_id, is_active);

CREATE TABLE IF NOT EXISTS public.admin_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'recharge_pending',
    'order_completed',
    'provider_product_submitted',
    'provider_product_published',
    'distributor_sale',
    'stock_out',
    'stock_low'
  )),
  entity_type text NOT NULL,
  entity_id uuid,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  push_attempted_at timestamptz,
  push_result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_event_log_created_at_idx
  ON public.admin_event_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_event_log_type_created_at_idx
  ON public.admin_event_log (event_type, created_at DESC);

-- NULL keeps stock-low push alerts disabled until an administrator selects a
-- threshold. Stock-out alerts are always enabled.
CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  low_stock_threshold integer CHECK (low_stock_threshold IS NULL OR low_stock_threshold > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.admin_notification_settings (id, low_stock_threshold)
VALUES ('default', NULL)
ON CONFLICT (id) DO NOTHING;

-- A distributor sale now has an explicit, auditable source instead of trying
-- to infer it from the buyer or product owner.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS distributor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_distributor_created_idx
  ON public.orders (distributor_id, created_at DESC)
  WHERE distributor_id IS NOT NULL;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.set_admin_mobile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.log_admin_event(
  _event_type text,
  _entity_type text,
  _entity_id uuid,
  _title text,
  _body text,
  _data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.admin_event_log (event_type, entity_type, entity_id, title, body, data)
  VALUES (_event_type, _entity_type, _entity_id, _title, _body, COALESCE(_data, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION private.profile_name(_user_id uuid, _fallback text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT nombre_completo FROM public.profiles WHERE id = _user_id), ''),
    NULLIF(_fallback, ''),
    'Usuario CMD'
  );
$$;

CREATE OR REPLACE FUNCTION private.notify_pending_recharge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requester_name text;
BEGIN
  IF NEW.estado <> 'pendiente'::public.recarga_status THEN
    RETURN NEW;
  END IF;

  requester_name := private.profile_name(NEW.user_id, NEW.nombre_declarado);
  PERFORM private.log_admin_event(
    'recharge_pending',
    'recargas',
    NEW.id,
    '💰 Nueva recarga',
    format('%s solicitó %s %s.', requester_name, NEW.moneda, trim(to_char(NEW.monto, 'FM999999990.00'))),
    jsonb_build_object('screen', 'recharges', 'rechargeId', NEW.id, 'userId', NEW.user_id)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_completed_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  became_completed boolean := false;
  already_completed boolean := false;
  distributor_was_added boolean := false;
  buyer_name text;
  distributor_name text;
BEGIN
  became_completed := COALESCE(NEW.payment_verified, false)
    AND NEW.estado IN ('pagado', 'entregado');

  IF TG_OP = 'UPDATE' THEN
    already_completed := COALESCE(OLD.payment_verified, false)
      AND OLD.estado IN ('pagado', 'entregado');
    distributor_was_added := OLD.distributor_id IS DISTINCT FROM NEW.distributor_id;
  END IF;

  IF became_completed AND NOT already_completed THEN
    buyer_name := private.profile_name(NEW.user_id, 'Cliente CMD');
    PERFORM private.log_admin_event(
      'order_completed',
      'orders',
      NEW.id,
      '🛒 Nueva venta',
      format('%s compró %s.', buyer_name, NEW.producto_nombre),
      jsonb_build_object('screen', 'events', 'orderId', NEW.id, 'productId', NEW.producto_id, 'userId', NEW.user_id)
    );
  END IF;

  IF became_completed
    AND NEW.distributor_id IS NOT NULL
    AND (NOT already_completed OR distributor_was_added)
  THEN
    distributor_name := private.profile_name(NEW.distributor_id, 'Distribuidor CMD');
    PERFORM private.log_admin_event(
      'distributor_sale',
      'orders',
      NEW.id,
      '🤝 Venta de distribuidor',
      format('%s vendió %s.', distributor_name, NEW.producto_nombre),
      jsonb_build_object('screen', 'events', 'orderId', NEW.id, 'productId', NEW.producto_id, 'distributorId', NEW.distributor_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_provider_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  provider_name text;
BEGIN
  IF NEW.supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  provider_name := private.profile_name(NEW.supplier_id, 'Proveedor CMD');
  IF TG_OP = 'INSERT' THEN
    PERFORM private.log_admin_event(
      'provider_product_submitted',
      'products',
      NEW.id,
      '📦 Producto nuevo de proveedor',
      format('%s agregó %s para revisión.', provider_name, NEW.name),
      jsonb_build_object('screen', 'events', 'productId', NEW.id, 'supplierId', NEW.supplier_id)
    );
  ELSIF OLD.is_active IS FALSE AND NEW.is_active IS TRUE THEN
    PERFORM private.log_admin_event(
      'provider_product_published',
      'products',
      NEW.id,
      '📦 Producto publicado',
      format('%s publicó %s.', provider_name, NEW.name),
      jsonb_build_object('screen', 'events', 'productId', NEW.id, 'supplierId', NEW.supplier_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  product_name text;
  threshold integer;
  old_available integer := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_available := COALESCE(OLD.available, 0);
  END IF;

  SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
  SELECT low_stock_threshold INTO threshold
  FROM public.admin_notification_settings
  WHERE id = 'default';

  IF TG_OP = 'UPDATE' AND old_available > 0 AND NEW.available = 0 THEN
    PERFORM private.log_admin_event(
      'stock_out',
      'products',
      NEW.product_id,
      '⚠️ Sin stock',
      format('%s se quedó sin unidades disponibles.', COALESCE(product_name, 'Este producto')),
      jsonb_build_object('screen', 'events', 'productId', NEW.product_id)
    );
  ELSIF threshold IS NOT NULL
    AND NEW.available > 0
    AND NEW.available <= threshold
    AND (TG_OP = 'INSERT' OR old_available > threshold)
  THEN
    PERFORM private.log_admin_event(
      'stock_low',
      'products',
      NEW.product_id,
      '⚠️ Stock bajo',
      format('%s tiene solo %s unidad(es) disponibles.', COALESCE(product_name, 'Este producto'), NEW.available),
      jsonb_build_object('screen', 'events', 'productId', NEW.product_id, 'available', NEW.available)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Only an administrator can register an authenticated device or read events.
ALTER TABLE public.admin_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_event_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage their own push tokens" ON public.admin_push_tokens;
CREATE POLICY "Admins manage their own push tokens"
ON public.admin_push_tokens FOR ALL TO authenticated
USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins read mobile event log" ON public.admin_event_log;
CREATE POLICY "Admins read mobile event log"
ON public.admin_event_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins manage mobile notification settings" ON public.admin_notification_settings;
CREATE POLICY "Admins manage mobile notification settings"
ON public.admin_notification_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.admin_push_tokens, public.admin_event_log, public.admin_notification_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_push_tokens TO authenticated;
GRANT SELECT ON public.admin_event_log TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.admin_notification_settings TO authenticated;
GRANT ALL ON public.admin_push_tokens, public.admin_event_log, public.admin_notification_settings TO service_role;

-- User-created orders cannot spoof a distributor relationship. A future
-- distributor workflow must use the guarded function below.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND distributor_id IS NULL);

CREATE OR REPLACE FUNCTION public.assign_distributor_to_order(
  _order_id uuid,
  _distributor_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.has_role(_distributor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'The selected user is not a distributor';
  END IF;

  UPDATE public.orders
  SET distributor_id = _distributor_id,
      updated_at = now()
  WHERE id = _order_id
  RETURNING * INTO updated_order;

  IF updated_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  RETURN updated_order;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_distributor_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_distributor_to_order(uuid, uuid) TO authenticated, service_role;

DROP TRIGGER IF EXISTS admin_push_tokens_set_updated_at ON public.admin_push_tokens;
CREATE TRIGGER admin_push_tokens_set_updated_at
BEFORE UPDATE ON public.admin_push_tokens
FOR EACH ROW EXECUTE FUNCTION private.set_admin_mobile_updated_at();

DROP TRIGGER IF EXISTS admin_notification_settings_set_updated_at ON public.admin_notification_settings;
CREATE TRIGGER admin_notification_settings_set_updated_at
BEFORE UPDATE ON public.admin_notification_settings
FOR EACH ROW EXECUTE FUNCTION private.set_admin_mobile_updated_at();

DROP TRIGGER IF EXISTS recargas_admin_event ON public.recargas;
CREATE TRIGGER recargas_admin_event
AFTER INSERT ON public.recargas
FOR EACH ROW EXECUTE FUNCTION private.notify_pending_recharge();

DROP TRIGGER IF EXISTS orders_admin_event ON public.orders;
CREATE TRIGGER orders_admin_event
AFTER INSERT OR UPDATE OF estado, payment_verified, distributor_id ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.notify_completed_order();

DROP TRIGGER IF EXISTS products_admin_event ON public.products;
CREATE TRIGGER products_admin_event
AFTER INSERT OR UPDATE OF is_active ON public.products
FOR EACH ROW EXECUTE FUNCTION private.notify_provider_product();

DROP TRIGGER IF EXISTS product_stock_admin_event ON public.product_stock;
CREATE TRIGGER product_stock_admin_event
AFTER INSERT OR UPDATE OF available ON public.product_stock
FOR EACH ROW EXECUTE FUNCTION private.notify_stock_change();

-- The Expo app refreshes these channels while it is open. Push delivery for a
-- closed app is performed by a Supabase Database Webhook on admin_event_log.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_event_log;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.recargas;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.log_admin_event(text, text, uuid, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.profile_name(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_pending_recharge() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_completed_order() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_provider_product() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_stock_change() FROM PUBLIC;
