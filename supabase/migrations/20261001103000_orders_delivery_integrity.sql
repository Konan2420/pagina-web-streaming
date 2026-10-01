-- Los pedidos se crean mediante RPCs que validan precio, saldo y stock.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
REVOKE INSERT ON public.orders FROM authenticated;

-- La asignaciÃ³n manual es parte del panel administrativo. Un comprador no puede
-- fabricar un pedido con payment_verified=true y adjudicarse una credencial.
CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  order_row public.orders%ROWTYPE;
  inventory_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT COALESCE(public.has_role(auth.uid(), 'admin'), false) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF order_row.producto_id IS DISTINCT FROM _product_id::text THEN
    RAISE EXCEPTION 'Product does not match order';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.account_inventory
    WHERE order_id = _order_id AND status IN ('assigned', 'vendida')
  ) THEN RETURN true; END IF;

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
  FROM public.account_inventory WHERE id = inventory_id;
  UPDATE public.orders SET estado = 'entregado', payment_verified = true, updated_at = now()
  WHERE id = _order_id;
  RETURN true;
END;
$$;

-- Cada pedido actual tiene a lo sumo una cuenta asignada y una entrega.
CREATE UNIQUE INDEX IF NOT EXISTS account_inventory_one_order_idx
  ON public.account_inventory (order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS delivered_accounts_one_order_idx
  ON public.delivered_accounts (order_id);
