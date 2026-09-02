-- PDP de catálogo con reventa. Los campos nuevos conservan las órdenes históricas
-- y separan al pagador (created_by) del cliente que recibe la cuenta (user_id/client_id).

CREATE TABLE IF NOT EXISTS public.catalog_pricing_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  default_markup_percent numeric(7, 3) NOT NULL DEFAULT 20
    CHECK (default_markup_percent >= 0 AND default_markup_percent <= 1000),
  pen_per_usd numeric(12, 6) NOT NULL DEFAULT 3.700000
    CHECK (pen_per_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.catalog_pricing_settings (id, default_markup_percent, pen_per_usd)
VALUES ('default', 20, 3.700000)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_catalog_pricing_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS catalog_pricing_settings_set_updated_at ON public.catalog_pricing_settings;
CREATE TRIGGER catalog_pricing_settings_set_updated_at
BEFORE UPDATE ON public.catalog_pricing_settings
FOR EACH ROW EXECUTE FUNCTION public.set_catalog_pricing_settings_updated_at();

ALTER TABLE public.catalog_pricing_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_pricing_settings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_pricing_settings TO authenticated;
GRANT ALL ON public.catalog_pricing_settings TO service_role;

DROP POLICY IF EXISTS "Admins manage catalog pricing settings" ON public.catalog_pricing_settings;
CREATE POLICY "Admins manage catalog pricing settings"
ON public.catalog_pricing_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_cost_pen numeric(16, 6)
    CHECK (unit_cost_pen IS NULL OR unit_cost_pen >= 0),
  ADD COLUMN IF NOT EXISTS cost_total_pen numeric(16, 6)
    CHECK (cost_total_pen IS NULL OR cost_total_pen >= 0),
  ADD COLUMN IF NOT EXISTS sale_price_pen numeric(16, 2)
    CHECK (sale_price_pen IS NULL OR sale_price_pen >= 0),
  ADD COLUMN IF NOT EXISTS profit_pen numeric(16, 2)
    CHECK (profit_pen IS NULL OR profit_pen >= 0),
  ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_renew_at date;

-- Las compras existentes son compras propias; el backfill no modifica importes ni estados.
UPDATE public.orders
SET created_by = COALESCE(created_by, user_id),
    client_id = COALESCE(client_id, user_id),
    sale_price_pen = COALESCE(sale_price_pen, precio)
WHERE created_by IS NULL
   OR client_id IS NULL
   OR sale_price_pen IS NULL;

CREATE INDEX IF NOT EXISTS orders_created_by_created_idx
  ON public.orders (created_by, created_at DESC)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_client_created_idx
  ON public.orders (client_id, created_at DESC)
  WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_auto_renew_at_idx
  ON public.orders (auto_renew_at)
  WHERE auto_renew IS TRUE AND auto_renew_at IS NOT NULL;

DROP POLICY IF EXISTS "Order creators view their orders" ON public.orders;
CREATE POLICY "Order creators view their orders"
ON public.orders FOR SELECT TO authenticated
USING (created_by = auth.uid());

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS catalog_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS wallet_transactions_catalog_order_idx
  ON public.wallet_transactions (catalog_order_id)
  WHERE catalog_order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.place_catalog_order_from_wallet(
  p_product_id uuid,
  p_client_id uuid,
  p_sale_price_pen numeric,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  order_id uuid,
  charged_pen numeric,
  charged_usd numeric,
  sale_price_pen numeric,
  profit_pen numeric,
  expires_on date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  product_row public.products%ROWTYPE;
  inventory_id uuid;
  created_order_id uuid;
  wholesale_cost numeric(16, 6);
  current_balance numeric(16, 6);
  debit_amount numeric(16, 6);
  normalized_sale_price numeric(16, 2);
  margin_amount numeric(16, 2);
  pen_per_usd_setting numeric(12, 6) := 3.700000;
  expiration_date date;
  can_resell boolean := false;
  enable_auto_renew boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to place a catalog order';
  END IF;

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'A client is required';
  END IF;

  can_resell :=
    public.has_role(actor_id, 'admin'::public.app_role)
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  IF p_client_id IS DISTINCT FROM actor_id AND NOT can_resell THEN
    RAISE EXCEPTION 'Only an elevated account can assign an order to another client';
  END IF;

  SELECT *
  INTO product_row
  FROM public.products
  WHERE id = p_product_id
    AND COALESCE(is_active, true)
    AND COALESCE(is_catalog_available, true)
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  SELECT COALESCE(c.unit_cost_pen, product_row.price)
  INTO wholesale_cost
  FROM public.catalog_product_costs c
  WHERE c.product_id = p_product_id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);

  IF can_resell THEN
    normalized_sale_price := round(COALESCE(p_sale_price_pen, 0), 2);
    IF normalized_sale_price < wholesale_cost THEN
      RAISE EXCEPTION 'Sale price must cover the product cost';
    END IF;
    debit_amount := wholesale_cost;
  ELSE
    -- El cliente final siempre paga el precio público; nunca el costo interno.
    normalized_sale_price := round(product_row.price, 2);
    debit_amount := product_row.price;
  END IF;

  SELECT ai.id
  INTO inventory_id
  FROM public.account_inventory ai
  WHERE ai.product_id = p_product_id
    AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF inventory_id IS NULL THEN
    RAISE EXCEPTION 'No stock available';
  END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT saldo_pen
  INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;

  IF current_balance < debit_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;

  expiration_date := (now() AT TIME ZONE 'America/Lima')::date + product_row.duration_days;
  enable_auto_renew := COALESCE(p_auto_renew, false) AND COALESCE(product_row.is_renewable, true);
  margin_amount := round(normalized_sale_price - wholesale_cost, 2);

  INSERT INTO public.orders (
    user_id,
    created_by,
    client_id,
    producto_id,
    producto_nombre,
    precio,
    unit_cost_pen,
    cost_total_pen,
    sale_price_pen,
    profit_pen,
    auto_renew,
    auto_renew_at,
    fecha_vencimiento,
    estado,
    payment_verified
  ) VALUES (
    p_client_id,
    actor_id,
    p_client_id,
    p_product_id::text,
    product_row.name,
    normalized_sale_price,
    wholesale_cost,
    debit_amount,
    normalized_sale_price,
    margin_amount,
    enable_auto_renew,
    CASE WHEN enable_auto_renew THEN expiration_date - 3 ELSE NULL END,
    expiration_date,
    'entregado',
    true
  ) RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned',
      order_id = created_order_id,
      assigned_at = now(),
      payment_verified = true
  WHERE id = inventory_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT created_order_id, p_client_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = inventory_id;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - debit_amount
  WHERE user_id = actor_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    amount_pen,
    balance_after_pen,
    transaction_type,
    catalog_order_id,
    description
  ) VALUES (
    actor_id,
    -debit_amount,
    current_balance - debit_amount,
    'catalog_order_cost',
    created_order_id,
    CASE WHEN can_resell THEN 'Costo de pedido de catálogo para cliente' ELSE 'Compra de catálogo' END
  );

  SELECT pen_per_usd
  INTO pen_per_usd_setting
  FROM public.catalog_pricing_settings
  WHERE id = 'default';

  RETURN QUERY SELECT
    created_order_id,
    debit_amount,
    round(debit_amount / COALESCE(pen_per_usd_setting, 3.700000), 2),
    normalized_sale_price,
    margin_amount,
    expiration_date;
END;
$$;

REVOKE ALL ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) TO authenticated, service_role;

COMMENT ON TABLE public.catalog_pricing_settings
IS 'Private global defaults for reseller price suggestions and PEN/USD display conversion.';
COMMENT ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean)
IS 'Atomically assigns one inventory account, debits the payer wallet and records an auditable catalog order.';
