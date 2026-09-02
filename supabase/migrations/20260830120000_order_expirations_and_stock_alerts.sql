-- Semi-automatic WhatsApp support for CMD Streaming.
-- This migration stores the expiration date required by the administrative
-- wa.me links. It never sends a message or calls a third-party API.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fecha_vencimiento date;

CREATE INDEX IF NOT EXISTS orders_expiration_date_idx
  ON public.orders (fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

-- Preserve historical purchases in the upcoming-expirations screen. This
-- backfill does not create messages and uses the delivered date in Lima plus
-- the configured duration of the product.
UPDATE public.orders AS o
SET fecha_vencimiento = (
  (COALESCE(da.created_at, o.created_at) AT TIME ZONE 'America/Lima')::date
  + COALESCE(
    (SELECT p.duration_days FROM public.products AS p WHERE p.id::text = o.producto_id),
    30
  )
)
FROM public.delivered_accounts AS da
WHERE da.order_id = o.id
  AND o.fecha_vencimiento IS NULL;

CREATE TABLE IF NOT EXISTS public.owner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type = 'stock_out'),
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS owner_notifications_user_created_idx
  ON public.owner_notifications (user_id, created_at DESC);

ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.owner_notifications FROM anon;
GRANT SELECT ON public.owner_notifications TO authenticated;
GRANT ALL ON public.owner_notifications TO service_role;

DROP POLICY IF EXISTS "Owners read their own notifications" ON public.owner_notifications;
CREATE POLICY "Owners read their own notifications"
ON public.owner_notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read owner notifications" ON public.owner_notifications;
CREATE POLICY "Admins read owner notifications"
ON public.owner_notifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION private.set_order_expiration_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  product_duration integer;
  delivered_on date;
BEGIN
  SELECT
    COALESCE(p.duration_days, 30),
    (COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/Lima')::date
  INTO product_duration, delivered_on
  FROM public.orders AS o
  LEFT JOIN public.products AS p ON p.id::text = o.producto_id
  WHERE o.id = NEW.order_id;

  UPDATE public.orders
  SET fecha_vencimiento = COALESCE(
    fecha_vencimiento,
    delivered_on + GREATEST(COALESCE(product_duration, 30), 1)
  )
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

-- Keep the current admin push events intact and add a visual alert for the
-- provider that owns the depleted product. Distributors have no product/stock
-- ownership in the present data model, so they do not receive this alert.
CREATE OR REPLACE FUNCTION private.notify_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  product_name text;
  supplier_user_id uuid;
  threshold integer;
  old_available integer := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_available := COALESCE(OLD.available, 0);
  END IF;

  SELECT name, supplier_id
  INTO product_name, supplier_user_id
  FROM public.products
  WHERE id = NEW.product_id;

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

    IF supplier_user_id IS NOT NULL THEN
      INSERT INTO public.owner_notifications (user_id, product_id, notification_type, title, body)
      VALUES (
        supplier_user_id,
        NEW.product_id,
        'stock_out',
        'Stock agotado',
        format('%s se quedó sin cuentas disponibles. Agrega stock para mantener las ventas activas.', COALESCE(product_name, 'Tu producto'))
      );
    END IF;
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

DROP TRIGGER IF EXISTS delivered_accounts_set_expiration ON public.delivered_accounts;
CREATE TRIGGER delivered_accounts_set_expiration
AFTER INSERT ON public.delivered_accounts
FOR EACH ROW EXECUTE FUNCTION private.set_order_expiration_on_delivery();

REVOKE ALL ON FUNCTION private.set_order_expiration_on_delivery() FROM PUBLIC;
