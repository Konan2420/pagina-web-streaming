-- Admin approval flow: reserve one account, verify payment and deliver it atomically.
-- This migration depends on 20260821000000_marketplace_simple.sql.

CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _account_id uuid;
  _user_id uuid;
  _stored_product_id text;
  _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL OR NOT public.has_role(_caller, 'admin') THEN
    RAISE EXCEPTION 'Only administrators can approve and deliver orders';
  END IF;

  -- Lock the order first so two approval attempts cannot consume two accounts.
  SELECT user_id, producto_id
  INTO _user_id, _stored_product_id
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Order was not found';
  END IF;

  IF _stored_product_id IS DISTINCT FROM _product_id::text THEN
    RAISE EXCEPTION 'The product does not match the order';
  END IF;

  IF EXISTS (SELECT 1 FROM public.delivered_accounts WHERE order_id = _order_id) THEN
    RAISE EXCEPTION 'This order was already delivered';
  END IF;

  SELECT id
  INTO _account_id
  FROM public.account_inventory
  WHERE product_id = _product_id
    AND status IN ('available', 'disponible')
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _account_id IS NULL THEN
    RAISE EXCEPTION 'No stock available for this product';
  END IF;

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

  UPDATE public.orders
  SET payment_verified = true,
      estado = 'entregado',
      updated_at = now()
  WHERE id = _order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;
