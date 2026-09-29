-- Paid festive boxes: unlimited purchases, a maximum of three winners per
-- event, and transactional admin mutations that do not depend on client-side
-- table INSERT/DELETE privileges.
BEGIN;

ALTER TABLE public.festive_events
  ADD COLUMN IF NOT EXISTS box_price_pen numeric(10,2) NOT NULL DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS box_price_usd numeric(10,2) NOT NULL DEFAULT 0.88,
  ADD COLUMN IF NOT EXISTS draw_limit integer NOT NULL DEFAULT 3;

ALTER TABLE public.festive_events
  DROP CONSTRAINT IF EXISTS festive_events_box_price_pen_check,
  DROP CONSTRAINT IF EXISTS festive_events_box_price_usd_check,
  DROP CONSTRAINT IF EXISTS festive_events_draw_limit_check;

ALTER TABLE public.festive_events
  ADD CONSTRAINT festive_events_box_price_pen_check CHECK (box_price_pen = 3.00),
  ADD CONSTRAINT festive_events_box_price_usd_check CHECK (box_price_usd = 0.88),
  ADD CONSTRAINT festive_events_draw_limit_check CHECK (draw_limit BETWEEN 1 AND 3);

UPDATE public.festive_events
SET box_price_pen = 3.00,
    box_price_usd = 0.88,
    draw_limit = 3,
    box_limit = 3
WHERE box_price_pen IS DISTINCT FROM 3.00
   OR box_price_usd IS DISTINCT FROM 0.88
   OR draw_limit IS DISTINCT FROM 3
   OR box_limit IS DISTINCT FROM 3;

CREATE TABLE IF NOT EXISTS public.festive_event_box_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.festive_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_pen numeric(10,2) NOT NULL CHECK (unit_price_pen = 3.00),
  unit_price_usd numeric(10,2) NOT NULL CHECK (unit_price_usd = 0.88),
  total_price_pen numeric(12,2) NOT NULL CHECK (total_price_pen > 0),
  total_price_usd numeric(12,2) NOT NULL CHECK (total_price_usd > 0),
  purchased_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festive_event_box_purchases_event_user_idx
  ON public.festive_event_box_purchases(event_id, user_id, purchased_at DESC);

ALTER TABLE public.festive_event_box_purchases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.festive_event_box_purchases FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.festive_event_box_purchases TO authenticated;
GRANT ALL ON public.festive_event_box_purchases TO service_role;

DROP POLICY IF EXISTS "Users read their festive box purchases" ON public.festive_event_box_purchases;
CREATE POLICY "Users read their festive box purchases"
  ON public.festive_event_box_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all festive box purchases" ON public.festive_event_box_purchases;
CREATE POLICY "Admins read all festive box purchases"
  ON public.festive_event_box_purchases FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'social_service_cost',
    'social_service_refund',
    'catalog_order_cost',
    'storefront_purchase',
    'storefront_sale_profit',
    'festive_box_purchase'
  ));

CREATE OR REPLACE FUNCTION public.save_festive_event(
  p_event jsonb,
  p_products jsonb DEFAULT '[]'::jsonb
)
RETURNS public.festive_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  event_id uuid;
  saved_event public.festive_events%ROWTYPE;
  product_row jsonb;
  selected_count integer := 0;
  requested_draw_limit integer;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized to manage festive events';
  END IF;

  IF p_event IS NULL OR jsonb_typeof(p_event) <> 'object' THEN
    RAISE EXCEPTION 'Event payload is required';
  END IF;

  event_id := NULLIF(p_event->>'id', '')::uuid;
  requested_draw_limit := LEAST(GREATEST(COALESCE(NULLIF(p_event->>'draw_limit', '')::integer, 3), 1), 3);

  IF NULLIF(btrim(p_event->>'name'), '') IS NULL
     OR NULLIF(btrim(p_event->>'banner_title'), '') IS NULL
     OR NULLIF(btrim(p_event->>'slug'), '') IS NULL THEN
    RAISE EXCEPTION 'Name, slug and banner title are required';
  END IF;

  IF (p_event->>'starts_at')::timestamptz >= (p_event->>'ends_at')::timestamptz THEN
    RAISE EXCEPTION 'Event end must be after its start';
  END IF;

  IF jsonb_typeof(COALESCE(p_products, '[]'::jsonb)) <> 'array'
     OR jsonb_array_length(COALESCE(p_products, '[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'At least one product is required';
  END IF;

  IF event_id IS NULL THEN
    INSERT INTO public.festive_events (
      name, slug, theme_key, accent_color, accent_color_2, icon_key,
      starts_at, ends_at, is_active, banner_title, banner_subtitle,
      box_limit, draw_limit, box_price_pen, box_price_usd, created_by
    ) VALUES (
      btrim(p_event->>'name'),
      lower(btrim(p_event->>'slug')),
      COALESCE(NULLIF(btrim(p_event->>'theme_key'), ''), 'fiestas_patrias'),
      NULLIF(p_event->>'accent_color', ''),
      NULLIF(p_event->>'accent_color_2', ''),
      COALESCE(NULLIF(btrim(p_event->>'icon_key'), ''), 'gift'),
      (p_event->>'starts_at')::timestamptz,
      (p_event->>'ends_at')::timestamptz,
      COALESCE((p_event->>'is_active')::boolean, false),
      btrim(p_event->>'banner_title'),
      NULLIF(btrim(COALESCE(p_event->>'banner_subtitle', '')), ''),
      requested_draw_limit,
      requested_draw_limit,
      3.00,
      0.88,
      actor_id
    ) RETURNING * INTO saved_event;
  ELSE
    UPDATE public.festive_events
    SET name = btrim(p_event->>'name'),
        slug = lower(btrim(p_event->>'slug')),
        theme_key = COALESCE(NULLIF(btrim(p_event->>'theme_key'), ''), 'fiestas_patrias'),
        accent_color = NULLIF(p_event->>'accent_color', ''),
        accent_color_2 = NULLIF(p_event->>'accent_color_2', ''),
        icon_key = COALESCE(NULLIF(btrim(p_event->>'icon_key'), ''), 'gift'),
        starts_at = (p_event->>'starts_at')::timestamptz,
        ends_at = (p_event->>'ends_at')::timestamptz,
        is_active = COALESCE((p_event->>'is_active')::boolean, false),
        banner_title = btrim(p_event->>'banner_title'),
        banner_subtitle = NULLIF(btrim(COALESCE(p_event->>'banner_subtitle', '')), ''),
        box_limit = requested_draw_limit,
        draw_limit = requested_draw_limit,
        box_price_pen = 3.00,
        box_price_usd = 0.88,
        updated_at = now()
    WHERE id = event_id
    RETURNING * INTO saved_event;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Festive event not found';
    END IF;
  END IF;

  DELETE FROM public.festive_event_products AS event_product
  WHERE event_product.event_id = saved_event.id;
  FOR product_row IN SELECT value FROM jsonb_array_elements(p_products) LOOP
    IF NULLIF(product_row->>'product_id', '') IS NULL
       OR COALESCE((product_row->>'weight')::integer, 0) <= 0 THEN
      CONTINUE;
    END IF;
    INSERT INTO public.festive_event_products (event_id, product_id, weight)
    VALUES (
      saved_event.id,
      (product_row->>'product_id')::uuid,
      GREATEST(1, (product_row->>'weight')::integer)
    );
    selected_count := selected_count + 1;
  END LOOP;

  IF selected_count = 0 THEN
    RAISE EXCEPTION 'At least one product with a positive weight is required';
  END IF;

  RETURN saved_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_festive_event(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  deleted_id uuid;
BEGIN
  IF actor_id IS NULL OR NOT public.has_role(actor_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized to manage festive events';
  END IF;
  DELETE FROM public.festive_events
  WHERE id = p_event_id
  RETURNING id INTO deleted_id;
  IF deleted_id IS NULL THEN
    RAISE EXCEPTION 'Festive event not found';
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_festive_boxes(
  p_event_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS TABLE(
  purchase_id uuid,
  quantity integer,
  total_pen numeric,
  total_usd numeric,
  balance_after_pen numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  event_row public.festive_events%ROWTYPE;
  current_balance numeric(16,6);
  total_pen_value numeric(12,2);
  total_usd_value numeric(12,2);
  created_purchase_id uuid;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to purchase festive boxes';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'Quantity must be between 1 and 1000';
  END IF;

  SELECT * INTO event_row
  FROM public.festive_events
  WHERE id = p_event_id
  FOR UPDATE;
  IF NOT FOUND OR NOT event_row.is_active
     OR event_row.starts_at > now() OR event_row.ends_at <= now() THEN
    RAISE EXCEPTION 'This festive event is not currently available for purchase';
  END IF;

  total_pen_value := round(event_row.box_price_pen * p_quantity, 2);
  total_usd_value := round(event_row.box_price_usd * p_quantity, 2);

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT saldo_pen INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;
  IF current_balance < total_pen_value THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before purchasing festive boxes';
  END IF;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - total_pen_value, updated_at = now()
  WHERE user_id = actor_id;

  INSERT INTO public.festive_event_box_purchases (
    event_id, user_id, quantity, unit_price_pen, unit_price_usd,
    total_price_pen, total_price_usd
  ) VALUES (
    p_event_id, actor_id, p_quantity, event_row.box_price_pen, event_row.box_price_usd,
    total_pen_value, total_usd_value
  ) RETURNING id INTO created_purchase_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, description
  ) VALUES (
    actor_id, -total_pen_value, current_balance - total_pen_value,
    'festive_box_purchase',
    format('Compra de %s caja(s) sorpresa: %s', p_quantity, event_row.name)
  );

  RETURN QUERY SELECT created_purchase_id, p_quantity, total_pen_value,
    total_usd_value, current_balance - total_pen_value;
END;
$$;

CREATE OR REPLACE FUNCTION public.open_festive_box(p_event_id uuid)
RETURNS TABLE(
  opening_id uuid,
  event_id uuid,
  product_id_won uuid,
  product_name text,
  order_id uuid,
  opened_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  event_row public.festive_events%ROWTYPE;
  selected_product_id uuid;
  total_weight numeric;
  draw_value numeric;
  placed_order record;
  opening_row public.festive_event_box_openings%ROWTYPE;
  available_boxes bigint;
  purchased_boxes bigint;
  winner_limit integer;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to open a festive box';
  END IF;

  SELECT * INTO event_row
  FROM public.festive_events
  WHERE public.festive_events.id = p_event_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Festive event not found'; END IF;
  IF NOT event_row.is_active OR event_row.starts_at > now() OR event_row.ends_at <= now() THEN
    RAISE EXCEPTION 'This festive event is not currently active';
  END IF;

  SELECT COALESCE(sum(quantity), 0) INTO purchased_boxes
  FROM public.festive_event_box_purchases AS purchase
  WHERE purchase.event_id = event_row.id AND purchase.user_id = actor_id;
  IF purchased_boxes < 1 THEN
    RAISE EXCEPTION 'Purchase at least one festive box before opening it';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.festive_event_box_openings AS existing_opening
    WHERE existing_opening.event_id = event_row.id AND existing_opening.user_id = actor_id
  ) THEN
    RAISE EXCEPTION 'You have already opened your box for this event';
  END IF;

  SELECT count(*) INTO available_boxes
  FROM public.festive_event_box_openings AS existing_opening
  WHERE existing_opening.event_id = event_row.id;
  winner_limit := LEAST(GREATEST(COALESCE(event_row.draw_limit, 3), 1), 3);
  IF available_boxes >= winner_limit THEN
    RAISE EXCEPTION 'No festive boxes are available';
  END IF;

  SELECT COALESCE(sum(event_product.weight), 0) INTO total_weight
  FROM public.festive_event_products AS event_product
  JOIN public.products AS product ON product.id = event_product.product_id
  WHERE event_product.event_id = event_row.id
    AND COALESCE(product.is_active, true)
    AND COALESCE(product.is_catalog_available, true)
    AND EXISTS (
      SELECT 1 FROM public.account_inventory AS inventory
      WHERE inventory.product_id = product.id
        AND inventory.status IN ('available', 'disponible')
    );
  IF total_weight <= 0 THEN
    RAISE EXCEPTION 'No configured festive product has available stock';
  END IF;

  draw_value := random() * total_weight;
  SELECT weighted.product_id INTO selected_product_id
  FROM (
    SELECT event_product.product_id,
      sum(event_product.weight) OVER (
        ORDER BY event_product.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS cumulative_weight
    FROM public.festive_event_products AS event_product
    JOIN public.products AS product ON product.id = event_product.product_id
    WHERE event_product.event_id = event_row.id
      AND COALESCE(product.is_active, true)
      AND COALESCE(product.is_catalog_available, true)
      AND EXISTS (
        SELECT 1 FROM public.account_inventory AS inventory
        WHERE inventory.product_id = product.id
          AND inventory.status IN ('available', 'disponible')
      )
    ORDER BY event_product.id
  ) AS weighted
  WHERE weighted.cumulative_weight >= draw_value
  ORDER BY weighted.cumulative_weight
  LIMIT 1;
  IF selected_product_id IS NULL THEN RAISE EXCEPTION 'The festive draw did not produce a product'; END IF;

  SELECT * INTO placed_order FROM public.place_order_with_inventory(selected_product_id);
  UPDATE public.orders
  SET precio = 0, sale_price_pen = 0, unit_cost_pen = NULL, cost_total_pen = 0,
      profit_pen = 0, payment_verified = true, updated_at = now()
  WHERE id = placed_order.order_id;

  INSERT INTO public.festive_event_box_openings (event_id, user_id, product_id_won, order_id)
  VALUES (event_row.id, actor_id, selected_product_id, placed_order.order_id)
  RETURNING * INTO opening_row;

  RETURN QUERY SELECT opening_row.id, opening_row.event_id, opening_row.product_id_won,
    placed_order.product_name, opening_row.order_id, opening_row.opened_at;
END;
$$;

REVOKE ALL ON FUNCTION public.save_festive_event(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_festive_event(jsonb, jsonb) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.delete_festive_event(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_festive_event(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.purchase_festive_boxes(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_festive_boxes(uuid, integer) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.open_festive_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_festive_box(uuid) TO authenticated, service_role;

COMMIT;
