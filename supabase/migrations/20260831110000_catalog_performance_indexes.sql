-- Optimiza el listado público ordenado por fecha y los recálculos de stock.
-- No modifica datos ni políticas RLS.
CREATE INDEX IF NOT EXISTS products_active_created_at_idx
  ON public.products (is_active, created_at DESC);

-- El trigger refresh_product_stock cuenta inventario disponible por producto.
-- Este índice evita recorridos completos de inventario al actualizar stock.
CREATE INDEX IF NOT EXISTS account_inventory_product_status_idx
  ON public.account_inventory (product_id, status);
