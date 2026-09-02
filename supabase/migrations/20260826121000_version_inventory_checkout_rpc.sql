-- Versioned immediate-delivery checkout. This replaces the previously
-- untracked legacy function so every environment receives the same behavior.

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

  SELECT p.name, p.price
  INTO _product_name, _price
  FROM public.products p
  WHERE p.id = _product_id AND COALESCE(p.is_active, true);

  IF _product_name IS NULL THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  SELECT ai.id
  INTO _account_id
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
  SET status = 'assigned',
      order_id = _order_id,
      assigned_at = now(),
      payment_verified = true
  WHERE id = _account_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, _user_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = _account_id;

  RETURN QUERY SELECT _order_id, _product_name, _price;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_orders_with_inventory(_product_ids uuid[])
RETURNS TABLE(order_id uuid, product_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _product_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF COALESCE(array_length(_product_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOREACH _product_id IN ARRAY _product_ids
  LOOP
    RETURN QUERY SELECT * FROM public.place_order_with_inventory(_product_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_inventory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_with_inventory(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.place_orders_with_inventory(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_orders_with_inventory(uuid[]) TO authenticated, service_role;
