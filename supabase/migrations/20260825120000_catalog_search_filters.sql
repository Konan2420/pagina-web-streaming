-- Campos de catálogo para filtros y ordenamiento de la tienda pública.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS duration_days integer,
  ADD COLUMN IF NOT EXISTS is_renewable boolean,
  ADD COLUMN IF NOT EXISTS total_vendidos integer;

UPDATE public.products
SET
  duration_days = COALESCE(duration_days, 30),
  is_renewable = COALESCE(is_renewable, true),
  total_vendidos = COALESCE(total_vendidos, 0);

ALTER TABLE public.products
  ALTER COLUMN duration_days SET DEFAULT 30,
  ALTER COLUMN duration_days SET NOT NULL,
  ALTER COLUMN is_renewable SET DEFAULT true,
  ALTER COLUMN is_renewable SET NOT NULL,
  ALTER COLUMN total_vendidos SET DEFAULT 0,
  ALTER COLUMN total_vendidos SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_duration_days_positive'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_duration_days_positive CHECK (duration_days > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_total_vendidos_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_total_vendidos_nonnegative CHECK (total_vendidos >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_catalog_filters_idx
  ON public.products (is_active, category, price, created_at DESC);

CREATE INDEX IF NOT EXISTS products_catalog_sales_idx
  ON public.products (is_active, total_vendidos DESC, created_at DESC);

-- Mantiene el contador de ventas sincronizado únicamente para pedidos ya pagados
-- y entregados. También cubre cambios de estado posteriores a la creación del pedido.
CREATE OR REPLACE FUNCTION public.sync_product_total_vendidos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  old_counts_as_sale boolean := false;
  new_counts_as_sale boolean := false;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_counts_as_sale := COALESCE(OLD.payment_verified, false)
      AND OLD.estado IN ('pagado', 'entregado');
  END IF;

  new_counts_as_sale := COALESCE(NEW.payment_verified, false)
    AND NEW.estado IN ('pagado', 'entregado');

  IF old_counts_as_sale
    AND (NOT new_counts_as_sale OR OLD.producto_id IS DISTINCT FROM NEW.producto_id) THEN
    UPDATE public.products
    SET total_vendidos = GREATEST(total_vendidos - 1, 0)
    WHERE id::text = OLD.producto_id::text;
  END IF;

  IF new_counts_as_sale
    AND (NOT old_counts_as_sale OR OLD.producto_id IS DISTINCT FROM NEW.producto_id) THEN
    UPDATE public.products
    SET total_vendidos = total_vendidos + 1
    WHERE id::text = NEW.producto_id::text;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_sync_product_total_vendidos ON public.orders;
CREATE TRIGGER orders_sync_product_total_vendidos
AFTER INSERT OR UPDATE OF estado, payment_verified, producto_id ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_product_total_vendidos();

-- Inicializa el contador con los pedidos ya completados, sin depender de datos
-- de analítica del cliente.
UPDATE public.products AS product
SET total_vendidos = COALESCE((
  SELECT count(*)::integer
  FROM public.orders AS order_row
  WHERE order_row.producto_id::text = product.id::text
    AND COALESCE(order_row.payment_verified, false)
    AND order_row.estado IN ('pagado', 'entregado')
), 0);
