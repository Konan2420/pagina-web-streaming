-- Mantiene un producto publicado en el catálogo aunque temporalmente no pueda venderse.
-- `is_active` conserva su significado de publicación; este campo controla únicamente
-- la disponibilidad comercial que ve el comprador.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_catalog_available boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.products.is_catalog_available
IS 'Cuando es false el producto permanece visible como Fuera de Servicio y no puede comprarse.';

-- Consulta pública limitada para las tarjetas del catálogo. Nunca expone compradores,
-- pedidos, importes ni credenciales; devuelve solo la última venta confirmada de cada producto.
CREATE OR REPLACE FUNCTION public.get_catalog_product_activity(_product_ids uuid[])
RETURNS TABLE(product_id uuid, last_sale_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    product.id AS product_id,
    MAX(order_row.created_at) AS last_sale_at
  FROM public.products AS product
  LEFT JOIN public.orders AS order_row
    ON order_row.producto_id = product.id::text
    AND COALESCE(order_row.payment_verified, false)
    AND order_row.estado IN ('pagado', 'entregado')
  WHERE product.id = ANY(_product_ids)
    AND COALESCE(product.is_active, true)
  GROUP BY product.id;
$$;

REVOKE ALL ON FUNCTION public.get_catalog_product_activity(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catalog_product_activity(uuid[]) TO anon, authenticated, service_role;

CREATE INDEX IF NOT EXISTS orders_catalog_last_sale_idx
  ON public.orders (producto_id, created_at DESC)
  WHERE payment_verified IS TRUE
    AND estado IN ('pagado', 'entregado');

-- El checkout debe validar el mismo estado que la tarjeta para impedir una
-- compra desde un carrito abierto antes de marcar el producto fuera de servicio.
CREATE OR REPLACE FUNCTION public.place_order_with_inventory(_product_id uuid)
RETURNS TABLE(order_id uuid, product_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _account_id uuid;
  _order_id uuid;
  _product_name text;
  _price numeric;
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.name, p.price INTO _product_name, _price
  FROM public.products p
  WHERE p.id = _product_id
    AND COALESCE(p.is_active, true)
    AND COALESCE(p.is_catalog_available, true);

  IF _product_name IS NULL THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  SELECT ai.id INTO _account_id
  FROM public.account_inventory ai
  WHERE ai.product_id = _product_id
    AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _account_id IS NULL THEN
    RAISE EXCEPTION 'No stock available';
  END IF;

  INSERT INTO public.orders (user_id, producto_id, producto_nombre, precio, estado, payment_verified)
  VALUES (_user_id, _product_id::text, _product_name, _price, 'entregado', true)
  RETURNING id INTO _order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = _order_id, assigned_at = now(), payment_verified = true
  WHERE id = _account_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, _user_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = _account_id;

  RETURN QUERY SELECT _order_id, _product_name, _price;
END;
$$;
