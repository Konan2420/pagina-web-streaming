-- Fix PL/pgSQL ambiguity between the RETURNS TABLE event_id variable and
-- festive_event_box_openings.event_id inside open_festive_box.
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
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to open a festive box';
  END IF;

  SELECT *
  INTO event_row
  FROM public.festive_events
  WHERE public.festive_events.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Festive event not found';
  END IF;

  IF NOT event_row.is_active
    OR event_row.starts_at > now()
    OR event_row.ends_at <= now() THEN
    RAISE EXCEPTION 'This festive event is not currently active';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.festive_event_box_openings AS existing_opening
    WHERE existing_opening.event_id = event_row.id
      AND existing_opening.user_id = actor_id
  ) THEN
    RAISE EXCEPTION 'You have already opened your box for this event';
  END IF;

  SELECT count(*)
  INTO available_boxes
  FROM public.festive_event_box_openings AS existing_opening
  WHERE existing_opening.event_id = event_row.id;

  IF event_row.box_limit IS NOT NULL AND available_boxes >= event_row.box_limit THEN
    RAISE EXCEPTION 'No festive boxes are available';
  END IF;

  SELECT COALESCE(sum(event_product.weight), 0)
  INTO total_weight
  FROM public.festive_event_products AS event_product
  JOIN public.products AS product ON product.id = event_product.product_id
  WHERE event_product.event_id = event_row.id
    AND COALESCE(product.is_active, true)
    AND COALESCE(product.is_catalog_available, true)
    AND EXISTS (
      SELECT 1
      FROM public.account_inventory AS inventory
      WHERE inventory.product_id = product.id
        AND inventory.status IN ('available', 'disponible')
    );

  IF total_weight <= 0 THEN
    RAISE EXCEPTION 'No configured festive product has available stock';
  END IF;

  draw_value := random() * total_weight;

  SELECT weighted.product_id
  INTO selected_product_id
  FROM (
    SELECT
      event_product.product_id,
      sum(event_product.weight) OVER (
        ORDER BY event_product.id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS cumulative_weight
    FROM public.festive_event_products AS event_product
    JOIN public.products AS product ON product.id = event_product.product_id
    WHERE event_product.event_id = event_row.id
      AND COALESCE(product.is_active, true)
      AND COALESCE(product.is_catalog_available, true)
      AND EXISTS (
        SELECT 1
        FROM public.account_inventory AS inventory
        WHERE inventory.product_id = product.id
          AND inventory.status IN ('available', 'disponible')
      )
    ORDER BY event_product.id
  ) AS weighted
  WHERE weighted.cumulative_weight >= draw_value
  ORDER BY weighted.cumulative_weight
  LIMIT 1;

  IF selected_product_id IS NULL THEN
    RAISE EXCEPTION 'The festive draw did not produce a product';
  END IF;

  SELECT *
  INTO placed_order
  FROM public.place_order_with_inventory(selected_product_id);

  UPDATE public.orders
  SET precio = 0,
      sale_price_pen = 0,
      unit_cost_pen = NULL,
      cost_total_pen = 0,
      profit_pen = 0,
      payment_verified = true,
      updated_at = now()
  WHERE id = placed_order.order_id;

  INSERT INTO public.festive_event_box_openings (
    event_id,
    user_id,
    product_id_won,
    order_id
  )
  VALUES (
    event_row.id,
    actor_id,
    selected_product_id,
    placed_order.order_id
  )
  RETURNING * INTO opening_row;

  RETURN QUERY
  SELECT
    opening_row.id,
    opening_row.event_id,
    opening_row.product_id_won,
    placed_order.product_name,
    opening_row.order_id,
    opening_row.opened_at;
END;
$$;

REVOKE ALL ON FUNCTION public.open_festive_box(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_festive_box(uuid) TO authenticated, service_role;
