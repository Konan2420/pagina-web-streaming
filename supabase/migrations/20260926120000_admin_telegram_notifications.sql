-- Notificaciones administrativas por Telegram.
--
-- La transacción de negocio solo registra un evento y encola una entrega. La
-- llamada a Telegram se ejecuta fuera de la transacción mediante la Edge
-- Function send-telegram-notification, por lo que una caída de Telegram nunca
-- bloquea registros, recargas ni pedidos.

ALTER TABLE public.admin_event_log
  ADD COLUMN IF NOT EXISTS dedupe_key text;

DROP INDEX IF EXISTS public.admin_event_log_dedupe_key_idx;
CREATE UNIQUE INDEX admin_event_log_dedupe_key_idx
  ON public.admin_event_log (dedupe_key)
  WHERE dedupe_key IS NOT NULL;

ALTER TABLE public.admin_event_log
  DROP CONSTRAINT IF EXISTS admin_event_log_event_type_check;
ALTER TABLE public.admin_event_log
  ADD CONSTRAINT admin_event_log_event_type_check CHECK (event_type IN (
    'recharge_pending',
    'recharge_verified',
    'provider_recharge',
    'distributor_recharge',
    'order_completed',
    'business_sale',
    'user_registered',
    'provider_product_submitted',
    'provider_product_published',
    'distributor_sale',
    'stock_out',
    'stock_low'
  ));

CREATE TABLE IF NOT EXISTS public.admin_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.admin_event_log(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('telegram', 'web_push', 'email')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id text,
  last_error text,
  next_retry_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, channel)
);

CREATE INDEX IF NOT EXISTS admin_notification_deliveries_pending_idx
  ON public.admin_notification_deliveries (channel, status, next_retry_at, created_at);

CREATE OR REPLACE FUNCTION private.set_admin_notification_delivery_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_notification_deliveries_set_updated_at
  ON public.admin_notification_deliveries;
CREATE TRIGGER admin_notification_deliveries_set_updated_at
  BEFORE UPDATE ON public.admin_notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION private.set_admin_notification_delivery_updated_at();

-- Inserta una sola vez cada evento nuevo. Los eventos históricos no tienen
-- dedupe_key y siguen siendo compatibles con el sistema móvil existente.
CREATE OR REPLACE FUNCTION private.log_admin_event_once(
  _event_type text,
  _entity_type text,
  _entity_id uuid,
  _title text,
  _body text,
  _data jsonb,
  _dedupe_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.admin_event_log (
    event_type, entity_type, entity_id, title, body, data, dedupe_key
  )
  VALUES (
    _event_type,
    _entity_type,
    _entity_id,
    _title,
    _body,
    COALESCE(_data, '{}'::jsonb),
    NULLIF(btrim(_dedupe_key), '')
  )
  ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_admin_user_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  display_name text;
BEGIN
  display_name := COALESCE(
    NULLIF(btrim(NEW.nombre_completo), ''),
    NULLIF(btrim(NEW.email), ''),
    'Usuario CMD'
  );

  PERFORM private.log_admin_event_once(
    'user_registered',
    'profiles',
    NEW.id,
    '👤 Nuevo registro',
    format('%s creó una cuenta en CMD Streaming.', display_name),
    jsonb_build_object(
      'screen', 'users',
      'userId', NEW.id,
      'name', display_name,
      'email', NEW.email
    ),
    format('user_registered:%s', NEW.id)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_admin_recharge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  requester_name text;
  requester_role text := 'cliente';
  event_type text;
  title text;
  body text;
  amount_text text;
BEGIN
  requester_name := private.profile_name(NEW.user_id, NEW.nombre_declarado);
  amount_text := format('%s %s', NEW.moneda, trim(to_char(NEW.monto, 'FM999999990.00')));

  IF public.has_role(NEW.user_id, 'proveedor'::public.app_role) THEN
    requester_role := 'proveedor';
  ELSIF public.has_role(NEW.user_id, 'distribuidor'::public.app_role) THEN
    requester_role := 'distribuidor';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.estado = 'pendiente'::public.recarga_status THEN
    event_type := CASE requester_role
      WHEN 'proveedor' THEN 'provider_recharge'
      WHEN 'distribuidor' THEN 'distributor_recharge'
      ELSE 'recharge_pending'
    END;
    title := CASE requester_role
      WHEN 'proveedor' THEN '💰 Recarga de proveedor'
      WHEN 'distribuidor' THEN '💰 Recarga de distribuidor'
      ELSE '💰 Nueva recarga'
    END;
    body := format('%s solicitó una recarga de %s.', requester_name, amount_text);
  ELSIF TG_OP = 'UPDATE'
    AND OLD.estado IS DISTINCT FROM NEW.estado
    AND NEW.estado = 'verificado'::public.recarga_status
  THEN
    event_type := 'recharge_verified';
    title := '✅ Recarga verificada';
    body := format('%s recibió una recarga de %s.', requester_name,
      format('PEN %s', trim(to_char(COALESCE(NEW.monto_acreditado_pen, NEW.monto), 'FM999999990.00'))));
  ELSE
    RETURN NEW;
  END IF;

  PERFORM private.log_admin_event_once(
    event_type,
    'recargas',
    NEW.id,
    title,
    body,
    jsonb_build_object(
      'screen', 'recharges',
      'rechargeId', NEW.id,
      'userId', NEW.user_id,
      'role', requester_role,
      'amount', NEW.monto,
      'currency', NEW.moneda,
      'status', NEW.estado
    ),
    format('%s:%s', event_type, NEW.id)
  );
  RETURN NEW;
END;
$$;

-- Reemplaza el registro anterior de pedido para no enviar dos avisos cuando
-- una venta se origina desde Mis Pedidos para un cliente CRM.
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
  is_business_sale boolean := false;
  buyer_name text;
  seller_name text;
  client_name text;
  seller_role text;
  sale_amount text;
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
    seller_name := private.profile_name(NEW.created_by, 'Vendedor CMD');
    sale_amount := format('S/ %s', trim(to_char(COALESCE(NEW.sale_price_pen, NEW.precio), 'FM999999990.00')));

    IF NEW.created_by IS NOT NULL
      AND NEW.business_client_id IS NOT NULL
      AND (
        public.has_role(NEW.created_by, 'proveedor'::public.app_role)
        OR public.has_role(NEW.created_by, 'distribuidor'::public.app_role)
      )
    THEN
      SELECT client.nombre
      INTO client_name
      FROM public.business_clients AS client
      WHERE client.id = NEW.business_client_id
        AND (client.profile_id IS NULL OR client.profile_id IS DISTINCT FROM NEW.created_by);
      is_business_sale := client_name IS NOT NULL;
      IF public.has_role(NEW.created_by, 'proveedor'::public.app_role) THEN
        seller_role := 'proveedor';
      ELSE
        seller_role := 'distribuidor';
      END IF;
    END IF;

    IF is_business_sale THEN
      PERFORM private.log_admin_event_once(
        'business_sale',
        'orders',
        NEW.id,
        CASE seller_role
          WHEN 'proveedor' THEN '🤝 Venta de proveedor'
          ELSE '🤝 Venta de distribuidor'
        END,
        format('%s vendió %s a %s por %s.', seller_name, NEW.producto_nombre, client_name, sale_amount),
        jsonb_build_object(
          'screen', 'events',
          'orderId', NEW.id,
          'productId', NEW.producto_id,
          'sellerId', NEW.created_by,
          'sellerRole', seller_role,
          'businessClientId', NEW.business_client_id,
          'clientName', client_name,
          'salePricePen', NEW.sale_price_pen,
          'profitPen', NEW.profit_pen
        ),
        format('business_sale:%s', NEW.id)
      );
    ELSE
      PERFORM private.log_admin_event_once(
        'order_completed',
        'orders',
        NEW.id,
        '🛒 Nueva venta',
        format('%s compró %s.', buyer_name, NEW.producto_nombre),
        jsonb_build_object(
          'screen', 'events',
          'orderId', NEW.id,
          'productId', NEW.producto_id,
          'userId', NEW.user_id,
          'salePricePen', NEW.sale_price_pen
        ),
        format('order_completed:%s', NEW.id)
      );
    END IF;
  END IF;

  IF became_completed
    AND NEW.distributor_id IS NOT NULL
    AND (NOT already_completed OR distributor_was_added)
    AND NOT is_business_sale
  THEN
    seller_name := private.profile_name(NEW.distributor_id, 'Distribuidor CMD');
    PERFORM private.log_admin_event_once(
      'distributor_sale',
      'orders',
      NEW.id,
      '🤝 Venta de distribuidor',
      format('%s vendió %s.', seller_name, NEW.producto_nombre),
      jsonb_build_object('screen', 'events', 'orderId', NEW.id, 'productId', NEW.producto_id, 'distributorId', NEW.distributor_id),
      format('distributor_sale:%s', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Los servicios de Redes Sociales también se venden desde Mis Pedidos. Se
-- registra la venta al crear el pedido, cuando ya se debitó la cartera del
-- proveedor/distribuidor y existe el cliente CRM asociado.
CREATE OR REPLACE FUNCTION private.notify_business_social_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seller_name text;
  seller_role text;
  client_name text;
BEGIN
  IF NEW.created_by IS NULL OR NEW.business_client_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.has_role(NEW.created_by, 'proveedor'::public.app_role) THEN
    seller_role := 'proveedor';
  ELSIF public.has_role(NEW.created_by, 'distribuidor'::public.app_role) THEN
    seller_role := 'distribuidor';
  ELSE
    RETURN NEW;
  END IF;

  SELECT client.nombre
  INTO client_name
  FROM public.business_clients AS client
  WHERE client.id = NEW.business_client_id
    AND (client.profile_id IS NULL OR client.profile_id IS DISTINCT FROM NEW.created_by);
  IF client_name IS NULL THEN
    RETURN NEW;
  END IF;

  seller_name := private.profile_name(NEW.created_by, 'Vendedor CMD');
  PERFORM private.log_admin_event_once(
    'business_sale',
    'social_service_orders',
    NEW.id,
    CASE seller_role
      WHEN 'proveedor' THEN '🤝 Venta de servicio de proveedor'
      ELSE '🤝 Venta de servicio de distribuidor'
    END,
    format('%s vendió %s a %s por S/ %s.', seller_name, NEW.service_name, client_name,
      trim(to_char(NEW.sale_price_pen, 'FM999999990.00'))),
    jsonb_build_object(
      'screen', 'events',
      'socialOrderId', NEW.id,
      'sellerId', NEW.created_by,
      'sellerRole', seller_role,
      'businessClientId', NEW.business_client_id,
      'clientName', client_name,
      'salePricePen', NEW.sale_price_pen,
      'profitPen', NEW.profit_pen
    ),
    format('business_social_sale:%s', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_profile_registered_event ON public.profiles;
CREATE TRIGGER admin_profile_registered_event
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin_user_registered();

DROP TRIGGER IF EXISTS recargas_admin_event ON public.recargas;
CREATE TRIGGER recargas_admin_event
  AFTER INSERT OR UPDATE OF estado ON public.recargas
  FOR EACH ROW EXECUTE FUNCTION private.notify_admin_recharge();

DROP TRIGGER IF EXISTS social_orders_admin_event ON public.social_service_orders;
CREATE TRIGGER social_orders_admin_event
  AFTER INSERT ON public.social_service_orders
  FOR EACH ROW EXECUTE FUNCTION private.notify_business_social_sale();

-- A service-role Edge Function claims one delivery atomically. A delivery
-- stuck in "sending" for more than five minutes becomes retryable.
CREATE OR REPLACE FUNCTION public.claim_admin_notification_delivery(
  _event_id uuid,
  _channel text
)
RETURNS TABLE(delivery_id uuid, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  delivery public.admin_notification_deliveries%ROWTYPE;
BEGIN
  IF _channel NOT IN ('telegram', 'web_push', 'email') THEN
    RAISE EXCEPTION 'Unsupported notification channel';
  END IF;

  INSERT INTO public.admin_notification_deliveries (event_id, channel)
  VALUES (_event_id, _channel)
  ON CONFLICT (event_id, channel) DO NOTHING;

  SELECT *
  INTO delivery
  FROM public.admin_notification_deliveries
  WHERE event_id = _event_id AND channel = _channel
  FOR UPDATE;

  IF delivery.status = 'sent'
    OR (delivery.status = 'sending' AND delivery.updated_at > now() - interval '5 minutes')
    OR delivery.attempt_count >= 10
  THEN
    RETURN;
  END IF;

  UPDATE public.admin_notification_deliveries
  SET status = 'sending',
      attempt_count = delivery.attempt_count + 1,
      last_error = NULL,
      next_retry_at = NULL
  WHERE id = delivery.id
  RETURNING id, attempt_count INTO delivery_id, attempt_count;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_notification_delivery(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_notification_delivery(uuid, text) TO service_role;

ALTER TABLE public.admin_notification_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read notification deliveries" ON public.admin_notification_deliveries;
CREATE POLICY "Admins read notification deliveries"
  ON public.admin_notification_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.admin_notification_deliveries FROM anon, authenticated;
GRANT SELECT ON public.admin_notification_deliveries TO authenticated;
GRANT ALL ON public.admin_notification_deliveries TO service_role;

-- Secret compartido con la Edge Function. El valor nunca se guarda en el
-- repositorio ni se expone al cliente.
CREATE EXTENSION IF NOT EXISTS pg_net;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'admin_telegram_webhook_secret'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'admin_telegram_webhook_secret',
      'Authenticates admin_event_log database webhooks to Telegram Edge Function.'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.dispatch_admin_telegram_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, vault, net, pg_temp
AS $$
DECLARE
  webhook_secret text;
  delivery_id uuid;
BEGIN
  IF NEW.event_type NOT IN (
    'user_registered', 'recharge_pending', 'recharge_verified',
    'provider_recharge', 'distributor_recharge', 'order_completed',
    'business_sale', 'distributor_sale'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notification_deliveries (event_id, channel)
  VALUES (NEW.id, 'telegram')
  ON CONFLICT (event_id, channel) DO NOTHING
  RETURNING id INTO delivery_id;
  IF delivery_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
  INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'admin_telegram_webhook_secret'
  LIMIT 1;

  IF webhook_secret IS NULL THEN
    UPDATE public.admin_notification_deliveries
    SET status = 'failed', last_error = 'Telegram webhook secret unavailable'
    WHERE id = delivery_id;
    RAISE WARNING 'CMD Telegram dispatch skipped: webhook secret unavailable.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://jxxamracsyapozcepcgb.supabase.co/functions/v1/send-telegram-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-telegram-secret', webhook_secret
    ),
    body := jsonb_build_object('record', jsonb_build_object('id', NEW.id)),
    timeout_milliseconds := 1500
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'CMD Telegram dispatch failed for event %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.log_admin_event_once(text, text, uuid, text, text, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_admin_user_registered() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_admin_recharge() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.notify_business_social_sale() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.set_admin_notification_delivery_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.dispatch_admin_telegram_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS admin_event_log_dispatch_telegram ON public.admin_event_log;
CREATE TRIGGER admin_event_log_dispatch_telegram
  AFTER INSERT ON public.admin_event_log
  FOR EACH ROW EXECUTE FUNCTION private.dispatch_admin_telegram_event();
