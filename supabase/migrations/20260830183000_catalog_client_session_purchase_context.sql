-- The product detail page uses the authenticated Supabase browser client for
-- its read/checkout RPCs. This avoids duplicating a brittle Server Function
-- token hop while keeping costs and authorization enforced in PostgreSQL.

CREATE OR REPLACE FUNCTION public.get_catalog_purchase_context(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  product_row public.products%ROWTYPE;
  wholesale_cost numeric(16, 6);
  public_sale_price numeric(16, 2);
  default_markup_percent numeric(7, 3) := 20;
  pen_per_usd_setting numeric(12, 6) := 3.700000;
  can_resell boolean := false;
  is_admin boolean := false;
  supplier_name text;
  supplier_whatsapp text;
  store_slug text;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view purchase options';
  END IF;

  SELECT *
  INTO product_row
  FROM public.products
  WHERE id = p_product_id
    AND COALESCE(is_active, true)
    AND COALESCE(is_catalog_available, true);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  can_resell := is_admin
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  SELECT COALESCE(cost.unit_cost_pen, product_row.price)
  INTO wholesale_cost
  FROM public.catalog_product_costs AS cost
  WHERE cost.product_id = product_row.id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);

  SELECT settings.default_markup_percent, settings.pen_per_usd
  INTO default_markup_percent, pen_per_usd_setting
  FROM public.catalog_pricing_settings AS settings
  WHERE settings.id = 'default';
  default_markup_percent := COALESCE(default_markup_percent, 20);
  pen_per_usd_setting := COALESCE(pen_per_usd_setting, 3.700000);

  -- A retail client never receives the internal cost. The charged/displayed
  -- price is at least the configured platform-margin price, while preserving
  -- any higher public price set by the administrator.
  public_sale_price := GREATEST(
    round(product_row.price, 2),
    round(wholesale_cost * (1 + default_markup_percent / 100), 2)
  );

  supplier_name := COALESCE(NULLIF(product_row.publisher_name, ''), 'CMD Streaming');
  IF product_row.supplier_id IS NOT NULL THEN
    SELECT
      COALESCE(NULLIF(supplier.display_name, ''), NULLIF(profile.nombre_completo, ''), supplier_name),
      NULLIF(profile.whatsapp, ''),
      storefront.store_slug
    INTO supplier_name, supplier_whatsapp, store_slug
    FROM public.profiles AS profile
    LEFT JOIN public.supplier_profiles AS supplier ON supplier.user_id = product_row.supplier_id
    LEFT JOIN public.storefront_settings AS storefront
      ON storefront.store_owner_id = product_row.supplier_id
      AND storefront.is_public = true
    WHERE profile.id = product_row.supplier_id;
  END IF;

  RETURN jsonb_build_object(
    'isAvailable', true,
    'supplierName', supplier_name,
    'supplierWhatsapp', supplier_whatsapp,
    'storeSlug', store_slug,
    'defaultMarkupPercent', default_markup_percent,
    'suggestedSalePricePen', CASE
      WHEN can_resell THEN round(wholesale_cost * (1 + default_markup_percent / 100), 2)
      ELSE NULL
    END,
    'walletDebitPen', CASE WHEN can_resell THEN wholesale_cost ELSE public_sale_price END,
    'walletDebitUsd', round((CASE WHEN can_resell THEN wholesale_cost ELSE public_sale_price END) / pen_per_usd_setting, 2),
    'publicSalePricePen', public_sale_price,
    'unitCostPen', CASE WHEN can_resell THEN wholesale_cost ELSE NULL END,
    'durationDays', product_row.duration_days,
    'isRenewable', product_row.is_renewable
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalog_purchase_context(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalog_purchase_context(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_catalog_order_clients()
RETURNS TABLE(id uuid, nombre_completo text, whatsapp text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  can_resell boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view clients';
  END IF;

  can_resell :=
    public.has_role(actor_id, 'admin'::public.app_role)
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  IF can_resell THEN
    RETURN QUERY
    SELECT profile.id, profile.nombre_completo, profile.whatsapp
    FROM public.profiles AS profile
    ORDER BY COALESCE(profile.nombre_completo, profile.email, '') ASC;
  ELSE
    RETURN QUERY
    SELECT profile.id, profile.nombre_completo, profile.whatsapp
    FROM public.profiles AS profile
    WHERE profile.id = actor_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalog_order_clients() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalog_order_clients() TO authenticated, service_role;

-- Keep the atomic checkout RPC aligned with the price returned above.
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
  default_markup_percent numeric(7, 3) := 20;
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

  SELECT COALESCE(cost.unit_cost_pen, product_row.price)
  INTO wholesale_cost
  FROM public.catalog_product_costs AS cost
  WHERE cost.product_id = p_product_id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);

  SELECT settings.default_markup_percent, settings.pen_per_usd
  INTO default_markup_percent, pen_per_usd_setting
  FROM public.catalog_pricing_settings AS settings
  WHERE settings.id = 'default';
  default_markup_percent := COALESCE(default_markup_percent, 20);
  pen_per_usd_setting := COALESCE(pen_per_usd_setting, 3.700000);

  IF can_resell THEN
    normalized_sale_price := round(COALESCE(p_sale_price_pen, 0), 2);
    IF normalized_sale_price < wholesale_cost THEN
      RAISE EXCEPTION 'Sale price must cover the product cost';
    END IF;
    debit_amount := wholesale_cost;
  ELSE
    normalized_sale_price := GREATEST(
      round(product_row.price, 2),
      round(wholesale_cost * (1 + default_markup_percent / 100), 2)
    );
    debit_amount := normalized_sale_price;
  END IF;

  SELECT ai.id
  INTO inventory_id
  FROM public.account_inventory AS ai
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
    user_id, created_by, client_id, producto_id, producto_nombre, precio,
    unit_cost_pen, cost_total_pen, sale_price_pen, profit_pen, auto_renew,
    auto_renew_at, fecha_vencimiento, estado, payment_verified
  ) VALUES (
    p_client_id, actor_id, p_client_id, p_product_id::text, product_row.name,
    normalized_sale_price, wholesale_cost, debit_amount, normalized_sale_price,
    margin_amount, enable_auto_renew,
    CASE WHEN enable_auto_renew THEN expiration_date - 3 ELSE NULL END,
    expiration_date, 'entregado', true
  ) RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = created_order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT created_order_id, p_client_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = inventory_id;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - debit_amount
  WHERE user_id = actor_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description
  ) VALUES (
    actor_id, -debit_amount, current_balance - debit_amount, 'catalog_order_cost', created_order_id,
    CASE WHEN can_resell THEN 'Costo de pedido de catálogo para cliente' ELSE 'Compra de catálogo' END
  );

  RETURN QUERY SELECT
    created_order_id,
    debit_amount,
    round(debit_amount / pen_per_usd_setting, 2),
    normalized_sale_price,
    margin_amount,
    expiration_date;
END;
$$;

REVOKE ALL ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) TO authenticated, service_role;
