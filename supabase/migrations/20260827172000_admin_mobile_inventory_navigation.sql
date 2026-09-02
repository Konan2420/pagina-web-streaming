-- Stock notifications open the inventory view in the mobile administrator app.

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
      jsonb_build_object('screen', 'inventory', 'productId', NEW.product_id)
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
      jsonb_build_object('screen', 'inventory', 'productId', NEW.product_id, 'available', NEW.available)
    );
  END IF;
  RETURN NEW;
END;
$$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.product_stock;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
