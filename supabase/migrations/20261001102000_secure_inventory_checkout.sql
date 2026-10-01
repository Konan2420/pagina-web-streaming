-- Checkout seguro para el carrito legacy: valida aprobación, cobra saldo de billetera
-- y mantiene la asignación de inventario atómica bajo bloqueo SKIP LOCKED.
CREATE OR REPLACE FUNCTION public.place_order_with_inventory(_product_id uuid)
RETURNS TABLE(order_id uuid, product_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  product_row public.products%ROWTYPE;
  inventory_id uuid;
  created_order_id uuid;
  current_balance numeric(12,2);
  balance_after numeric(12,2);
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO product_row
  FROM public.products
  WHERE id = _product_id
    AND COALESCE(is_active, false)
    AND COALESCE(is_catalog_available, false)
    AND approval_status = 'approved'
  FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product is not available'; END IF;

  SELECT ai.id INTO inventory_id
  FROM public.account_inventory ai
  WHERE ai.product_id = _product_id
    AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
  IF inventory_id IS NULL THEN RAISE EXCEPTION 'No stock available'; END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT saldo_pen INTO current_balance
  FROM public.wallet_balances WHERE user_id = actor_id FOR UPDATE;
  IF current_balance < round(product_row.price, 2) THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;
  balance_after := current_balance - round(product_row.price, 2);

  INSERT INTO public.orders (user_id, created_by, producto_id, producto_nombre, precio, estado, payment_verified)
  VALUES (actor_id, actor_id, _product_id::text, product_row.name, round(product_row.price, 2), 'entregado', true)
  RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = created_order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_id;
  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT created_order_id, actor_id, email, password, access_link, notes
  FROM public.account_inventory WHERE id = inventory_id;

  UPDATE public.wallet_balances SET saldo_pen = balance_after WHERE user_id = actor_id;
  INSERT INTO public.wallet_transactions (user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description)
  VALUES (actor_id, -round(product_row.price, 2), balance_after, 'catalog_order_cost', created_order_id, 'Compra de catálogo');

  RETURN QUERY SELECT created_order_id, product_row.name, round(product_row.price, 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  order_row public.orders%ROWTYPE;
  inventory_id uuid;
  is_admin boolean;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  is_admin := public.has_role(actor_id, 'admin');

  SELECT * INTO order_row FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF order_row.user_id IS DISTINCT FROM actor_id AND NOT is_admin THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF order_row.producto_id IS DISTINCT FROM _product_id::text THEN RAISE EXCEPTION 'Product does not match order'; END IF;
  IF NOT COALESCE(order_row.payment_verified, false) AND NOT is_admin THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.account_inventory WHERE order_id = _order_id AND status IN ('assigned', 'vendida')) THEN RETURN true; END IF;

  SELECT ai.id INTO inventory_id
  FROM public.account_inventory ai
  WHERE ai.product_id = _product_id AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF inventory_id IS NULL THEN RETURN false; END IF;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = _order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_id;
  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, order_row.user_id, email, password, access_link, notes
  FROM public.account_inventory WHERE id = inventory_id
  ON CONFLICT (order_id) DO NOTHING;
  UPDATE public.orders SET estado = 'entregado', updated_at = now() WHERE id = _order_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_inventory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_with_inventory(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;
