-- Los usuarios finales no revenden servicios SMM. Aunque alteren el formulario
-- desde el navegador, el precio y la ganancia se fijan al costo real del servicio.
CREATE OR REPLACE FUNCTION public.place_social_service_order(
  p_service_id uuid,
  p_client_id uuid,
  p_target_url text,
  p_quantity integer,
  p_sale_price_pen numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  service_row public.social_service_catalog%ROWTYPE;
  current_balance numeric(16, 6);
  total_cost numeric(16, 6);
  configured_provider_key text;
  integration_is_configured boolean;
  normalized_url text := btrim(p_target_url);
  normalized_sale_price numeric(16, 2) := round(p_sale_price_pen, 2);
  created_order_id uuid;
  can_set_sale_price boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to place a social service order';
  END IF;

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'A client is required';
  END IF;

  can_set_sale_price :=
    public.has_role(actor_id, 'admin')
    OR public.has_role(actor_id, 'proveedor')
    OR public.has_role(actor_id, 'distribuidor');

  IF p_client_id IS DISTINCT FROM actor_id AND NOT can_set_sale_price THEN
    RAISE EXCEPTION 'Only an elevated account can assign an order to another client';
  END IF;

  IF char_length(normalized_url) < 3 OR char_length(normalized_url) > 2048 THEN
    RAISE EXCEPTION 'A valid target link is required';
  END IF;

  SELECT provider_key, is_configured
  INTO configured_provider_key, integration_is_configured
  FROM public.social_service_provider_status
  WHERE id = 'default';

  IF NOT COALESCE(integration_is_configured, false) THEN
    RAISE EXCEPTION 'The SMM provider is not configured yet';
  END IF;

  SELECT *
  INTO service_row
  FROM public.social_service_catalog
  WHERE id = p_service_id
    AND is_active
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected social service is unavailable';
  END IF;

  IF service_row.provider_key IS DISTINCT FROM configured_provider_key THEN
    RAISE EXCEPTION 'The selected service does not belong to the configured provider';
  END IF;

  IF p_quantity < service_row.min_quantity OR p_quantity > service_row.max_quantity THEN
    RAISE EXCEPTION 'Quantity must be between % and %', service_row.min_quantity, service_row.max_quantity;
  END IF;

  total_cost := round(service_row.unit_cost_pen * p_quantity, 6);

  IF can_set_sale_price THEN
    IF normalized_sale_price IS NULL OR normalized_sale_price < total_cost THEN
      RAISE EXCEPTION 'Sale price must cover the service cost';
    END IF;
  ELSE
    normalized_sale_price := total_cost;
  END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT saldo_pen
  INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;

  IF current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - total_cost
  WHERE user_id = actor_id;

  INSERT INTO public.social_service_orders (
    created_by,
    client_id,
    service_id,
    provider_key,
    provider_service_id,
    platform,
    category,
    service_name,
    target_url,
    quantity,
    unit_cost_pen,
    cost_total_pen,
    sale_price_pen,
    profit_pen
  ) VALUES (
    actor_id,
    p_client_id,
    service_row.id,
    service_row.provider_key,
    service_row.provider_service_id,
    service_row.platform,
    service_row.category,
    service_row.name,
    normalized_url,
    p_quantity,
    service_row.unit_cost_pen,
    total_cost,
    normalized_sale_price,
    normalized_sale_price - total_cost
  ) RETURNING id INTO created_order_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    amount_pen,
    balance_after_pen,
    transaction_type,
    social_service_order_id,
    description
  ) VALUES (
    actor_id,
    -total_cost,
    current_balance - total_cost,
    'social_service_cost',
    created_order_id,
    'Costo de servicio de redes sociales'
  );

  RETURN created_order_id;
END;
$$;

COMMENT ON FUNCTION public.place_social_service_order(uuid, uuid, text, integer, numeric)
IS 'Creates an SMM order, debits the creator wallet atomically, and permits sale margins only for admin, proveedor and distribuidor.';
