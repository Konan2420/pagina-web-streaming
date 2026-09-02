-- Dato operativo que el proveedor SMM completará al crear/sincronizar un pedido.
-- Las órdenes históricas permanecen válidas hasta que exista una API que aporte
-- la cantidad inicial.
ALTER TABLE public.social_service_orders
  ADD COLUMN IF NOT EXISTS initial_quantity integer
  CHECK (initial_quantity IS NULL OR initial_quantity >= 0);

-- No se permite una lectura directa desde el navegador: las proyecciones de
-- Mis Órdenes se entregan mediante Server Functions autenticadas, que eliminan
-- costo, precio de venta, ganancia e información operativa para el cliente final.
REVOKE SELECT ON TABLE public.social_service_orders FROM authenticated;

COMMENT ON COLUMN public.social_service_orders.initial_quantity
IS 'Initial provider count captured when the external SMM order is created or synchronized.';
