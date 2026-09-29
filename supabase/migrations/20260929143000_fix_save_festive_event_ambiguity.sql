-- Qualify the child-table event_id in the admin save RPC. PL/pgSQL otherwise
-- resolves it against the local event_id variable and rejects the mutation.
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
      btrim(p_event->>'name'), lower(btrim(p_event->>'slug')),
      COALESCE(NULLIF(btrim(p_event->>'theme_key'), ''), 'fiestas_patrias'),
      NULLIF(p_event->>'accent_color', ''), NULLIF(p_event->>'accent_color_2', ''),
      COALESCE(NULLIF(btrim(p_event->>'icon_key'), ''), 'gift'),
      (p_event->>'starts_at')::timestamptz, (p_event->>'ends_at')::timestamptz,
      COALESCE((p_event->>'is_active')::boolean, false),
      btrim(p_event->>'banner_title'),
      NULLIF(btrim(COALESCE(p_event->>'banner_subtitle', '')), ''),
      requested_draw_limit, requested_draw_limit, 3.00, 0.88, actor_id
    ) RETURNING * INTO saved_event;
  ELSE
    UPDATE public.festive_events
    SET name = btrim(p_event->>'name'), slug = lower(btrim(p_event->>'slug')),
        theme_key = COALESCE(NULLIF(btrim(p_event->>'theme_key'), ''), 'fiestas_patrias'),
        accent_color = NULLIF(p_event->>'accent_color', ''),
        accent_color_2 = NULLIF(p_event->>'accent_color_2', ''),
        icon_key = COALESCE(NULLIF(btrim(p_event->>'icon_key'), ''), 'gift'),
        starts_at = (p_event->>'starts_at')::timestamptz,
        ends_at = (p_event->>'ends_at')::timestamptz,
        is_active = COALESCE((p_event->>'is_active')::boolean, false),
        banner_title = btrim(p_event->>'banner_title'),
        banner_subtitle = NULLIF(btrim(COALESCE(p_event->>'banner_subtitle', '')), ''),
        box_limit = requested_draw_limit, draw_limit = requested_draw_limit,
        box_price_pen = 3.00, box_price_usd = 0.88, updated_at = now()
    WHERE id = event_id
    RETURNING * INTO saved_event;
    IF NOT FOUND THEN RAISE EXCEPTION 'Festive event not found'; END IF;
  END IF;

  DELETE FROM public.festive_event_products AS event_product
  WHERE event_product.event_id = saved_event.id;
  FOR product_row IN SELECT value FROM jsonb_array_elements(p_products) LOOP
    IF NULLIF(product_row->>'product_id', '') IS NULL
       OR COALESCE((product_row->>'weight')::integer, 0) <= 0 THEN
      CONTINUE;
    END IF;
    INSERT INTO public.festive_event_products (event_id, product_id, weight)
    VALUES (saved_event.id, (product_row->>'product_id')::uuid,
      GREATEST(1, (product_row->>'weight')::integer));
    selected_count := selected_count + 1;
  END LOOP;
  IF selected_count = 0 THEN
    RAISE EXCEPTION 'At least one product with a positive weight is required';
  END IF;
  RETURN saved_event;
END;
$$;

REVOKE ALL ON FUNCTION public.save_festive_event(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_festive_event(jsonb, jsonb) TO authenticated, service_role;
