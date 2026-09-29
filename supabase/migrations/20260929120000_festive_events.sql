-- Generic festive events, weighted surprise boxes, and secure server-side delivery.
-- The prize delivery reuses place_order_with_inventory so credentials continue to
-- use the existing account_inventory -> delivered_accounts flow.

BEGIN;

CREATE TABLE IF NOT EXISTS public.festive_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$'),
  theme_key text NOT NULL DEFAULT 'fiestas_patrias'
    CHECK (theme_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  accent_color text CHECK (accent_color IS NULL OR accent_color ~ '^#[0-9a-fA-F]{6}$'),
  accent_color_2 text CHECK (accent_color_2 IS NULL OR accent_color_2 ~ '^#[0-9a-fA-F]{6}$'),
  icon_key text NOT NULL DEFAULT 'gift' CHECK (icon_key ~ '^[a-z0-9_-]+$'),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  banner_title text NOT NULL CHECK (char_length(btrim(banner_title)) BETWEEN 1 AND 180),
  banner_subtitle text,
  box_limit integer CHECK (box_limit IS NULL OR box_limit > 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT festive_events_valid_period CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.festive_event_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.festive_events(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  weight integer NOT NULL DEFAULT 1 CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT festive_event_products_unique_product UNIQUE (event_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.festive_event_box_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.festive_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id_won uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  opened_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT festive_event_box_openings_one_per_user UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS festive_events_active_period_idx
  ON public.festive_events (is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS festive_event_products_event_idx
  ON public.festive_event_products (event_id, weight DESC);
CREATE INDEX IF NOT EXISTS festive_event_box_openings_event_idx
  ON public.festive_event_box_openings (event_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS festive_event_box_openings_user_idx
  ON public.festive_event_box_openings (user_id, opened_at DESC);

DROP TRIGGER IF EXISTS festive_events_set_updated_at ON public.festive_events;
CREATE TRIGGER festive_events_set_updated_at
  BEFORE UPDATE ON public.festive_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.festive_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festive_event_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festive_event_box_openings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.festive_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.festive_event_products FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.festive_event_box_openings FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.festive_events TO anon, authenticated;
GRANT SELECT ON public.festive_event_products TO anon, authenticated;
GRANT SELECT ON public.festive_event_box_openings TO authenticated;
GRANT ALL ON public.festive_events, public.festive_event_products, public.festive_event_box_openings
  TO service_role;

DROP POLICY IF EXISTS "Public can read active festive events" ON public.festive_events;
CREATE POLICY "Public can read active festive events"
  ON public.festive_events FOR SELECT TO anon, authenticated
  USING (is_active AND starts_at <= now() AND ends_at > now());

DROP POLICY IF EXISTS "Admins can read all festive events" ON public.festive_events;
CREATE POLICY "Admins can read all festive events"
  ON public.festive_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage festive events" ON public.festive_events;
CREATE POLICY "Admins can manage festive events"
  ON public.festive_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can read active festive event products" ON public.festive_event_products;
CREATE POLICY "Public can read active festive event products"
  ON public.festive_event_products FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.festive_events event
      WHERE event.id = festive_event_products.event_id
        AND event.is_active
        AND event.starts_at <= now()
        AND event.ends_at > now()
    )
  );

DROP POLICY IF EXISTS "Admins can read all festive event products" ON public.festive_event_products;
CREATE POLICY "Admins can read all festive event products"
  ON public.festive_event_products FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage festive event products" ON public.festive_event_products;
CREATE POLICY "Admins can manage festive event products"
  ON public.festive_event_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can read their festive box openings" ON public.festive_event_box_openings;
CREATE POLICY "Users can read their festive box openings"
  ON public.festive_event_box_openings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all festive box openings" ON public.festive_event_box_openings;
CREATE POLICY "Admins can read all festive box openings"
  ON public.festive_event_box_openings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- The client has no INSERT/UPDATE/DELETE grant on openings. This function is the
-- only authenticated entry point and resolves both the draw and delivery on the
-- server. It calls the existing delivery RPC instead of duplicating credential
-- assignment logic in the browser or in a second delivery implementation.
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

  -- Serializes openings for this event so box_limit cannot be exceeded by
  -- concurrent requests.
  SELECT *
  INTO event_row
  FROM public.festive_events
  WHERE id = p_event_id
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
    FROM public.festive_event_box_openings
    WHERE event_id = event_row.id AND user_id = actor_id
  ) THEN
    RAISE EXCEPTION 'You have already opened your box for this event';
  END IF;

  SELECT count(*)
  INTO available_boxes
  FROM public.festive_event_box_openings
  WHERE event_id = event_row.id;

  IF event_row.box_limit IS NOT NULL AND available_boxes >= event_row.box_limit THEN
    RAISE EXCEPTION 'No festive boxes are available';
  END IF;

  -- Only products that can be delivered now participate in the draw. The
  -- configured weights remain relative to the remaining available products.
  SELECT COALESCE(sum(event_product.weight), 0)
  INTO total_weight
  FROM public.festive_event_products event_product
  JOIN public.products product ON product.id = event_product.product_id
  WHERE event_product.event_id = event_row.id
    AND COALESCE(product.is_active, true)
    AND COALESCE(product.is_catalog_available, true)
    AND EXISTS (
      SELECT 1
      FROM public.account_inventory inventory
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
    FROM public.festive_event_products event_product
    JOIN public.products product ON product.id = event_product.product_id
    WHERE event_product.event_id = event_row.id
      AND COALESCE(product.is_active, true)
      AND COALESCE(product.is_catalog_available, true)
      AND EXISTS (
        SELECT 1
        FROM public.account_inventory inventory
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

  -- Uses the same server-side account_inventory -> delivered_accounts path as
  -- the existing catalog checkout. The following update makes the generated
  -- order a free reward while preserving the normal delivery record.
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

COMMENT ON TABLE public.festive_events IS
  'Generic manually activated event configuration for festive banners and surprise boxes.';
COMMENT ON TABLE public.festive_event_products IS
  'Weighted product pool for each festive event.';
COMMENT ON TABLE public.festive_event_box_openings IS
  'Auditable per-user festive openings and the delivered catalog order.';
COMMENT ON FUNCTION public.open_festive_box(uuid) IS
  'Server-side weighted draw with one opening per user and normal credential delivery.';

COMMIT;
