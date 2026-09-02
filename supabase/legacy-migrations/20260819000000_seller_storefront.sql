-- Seller storefronts: listings belong to a seller while the source inventory
-- and credentials remain owned by the supplier.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendedor';

CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 2 AND 80),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  banner_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  custom_name text,
  custom_description text,
  is_visible boolean NOT NULL DEFAULT false,
  price_sale numeric(12,2) NOT NULL CHECK (price_sale >= 0),
  promo_price numeric(12,2) CHECK (promo_price IS NULL OR (promo_price >= 0 AND promo_price <= price_sale)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.seller_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 160),
  description text,
  price_sale numeric(12,2) NOT NULL CHECK (price_sale >= 0),
  promo_price numeric(12,2) CHECK (promo_price IS NULL OR (promo_price >= 0 AND promo_price <= price_sale)),
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_combo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES public.seller_combos(id) ON DELETE CASCADE,
  seller_listing_id uuid NOT NULL REFERENCES public.seller_listings(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 20),
  UNIQUE (combo_id, seller_listing_id)
);

ALTER TABLE public.account_inventory
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS seller_listings_seller_idx ON public.seller_listings(seller_id);
CREATE INDEX IF NOT EXISTS seller_listings_public_idx ON public.seller_listings(seller_id, is_visible);
CREATE INDEX IF NOT EXISTS seller_combos_seller_idx ON public.seller_combos(seller_id);
CREATE INDEX IF NOT EXISTS account_inventory_seller_stock_idx
  ON public.account_inventory(seller_id, product_id, status)
  WHERE seller_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.seller_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_profiles_set_updated_at ON public.seller_profiles;
CREATE TRIGGER seller_profiles_set_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.seller_set_updated_at();

DROP TRIGGER IF EXISTS seller_listings_set_updated_at ON public.seller_listings;
CREATE TRIGGER seller_listings_set_updated_at
  BEFORE UPDATE ON public.seller_listings
  FOR EACH ROW EXECUTE FUNCTION public.seller_set_updated_at();

DROP TRIGGER IF EXISTS seller_combos_set_updated_at ON public.seller_combos;
CREATE TRIGGER seller_combos_set_updated_at
  BEFORE UPDATE ON public.seller_combos
  FOR EACH ROW EXECUTE FUNCTION public.seller_set_updated_at();

-- Backfill a profile for any seller role that was created before this migration.
INSERT INTO public.seller_profiles (user_id, display_name, slug)
SELECT
  p.id,
  COALESCE(NULLIF(trim(p.nombre_completo), ''), split_part(COALESCE(p.email, ''), '@', 1), 'Mi tienda'),
  'tienda-' || substr(replace(p.id::text, '-', ''), 1, 10)
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'vendedor'::public.app_role
)
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active seller profiles"
ON public.seller_profiles FOR SELECT
USING (status = 'active' OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Sellers can manage their profile"
ON public.seller_profiles FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Public can view visible seller listings"
ON public.seller_listings FOR SELECT
USING (
  (is_visible AND EXISTS (
    SELECT 1 FROM public.seller_profiles sp
    WHERE sp.user_id = seller_listings.seller_id AND sp.status = 'active'
  ))
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Sellers can manage their listings"
ON public.seller_listings FOR ALL TO authenticated
USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (
  (auth.uid() = seller_id AND public.has_role(auth.uid(), 'vendedor'::public.app_role))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Public can view visible seller combos"
ON public.seller_combos FOR SELECT
USING (
  (is_visible AND EXISTS (
    SELECT 1 FROM public.seller_profiles sp
    WHERE sp.user_id = seller_combos.seller_id AND sp.status = 'active'
  ))
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Sellers can manage their combos"
ON public.seller_combos FOR ALL TO authenticated
USING (auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (
  (auth.uid() = seller_id AND public.has_role(auth.uid(), 'vendedor'::public.app_role))
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Sellers can manage their combo items"
ON public.seller_combo_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.seller_combos sc
    WHERE sc.id = seller_combo_items.combo_id
      AND (sc.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.seller_combos sc
    JOIN public.seller_listings sl ON sl.id = seller_combo_items.seller_listing_id
    WHERE sc.id = seller_combo_items.combo_id
      AND sl.seller_id = sc.seller_id
      AND (sc.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_combos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_combo_items TO authenticated;
GRANT SELECT ON public.seller_profiles, public.seller_listings, public.seller_combos TO anon;
GRANT ALL ON public.seller_profiles, public.seller_listings, public.seller_combos, public.seller_combo_items TO service_role;

-- Accounts allocated to a seller must not be counted or delivered by the
-- global catalog. Their credentials are still never readable by sellers.
CREATE OR REPLACE VIEW public.stock_counts AS
  SELECT ai.product_id, COUNT(*)::int AS available
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
    AND ai.seller_id IS NULL
  GROUP BY ai.product_id;

CREATE OR REPLACE FUNCTION private.get_stock_counts(_product_ids uuid[])
RETURNS TABLE(product_id uuid, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT ai.product_id, COUNT(*)::int
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
    AND ai.seller_id IS NULL
    AND ai.product_id = ANY(_product_ids)
  GROUP BY ai.product_id
$$;

CREATE OR REPLACE FUNCTION public.refresh_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _product_id uuid;
BEGIN
  FOR _product_id IN
    SELECT DISTINCT product_id
    FROM (
      SELECT CASE WHEN TG_OP <> 'DELETE' THEN NEW.product_id END AS product_id
      UNION ALL
      SELECT CASE WHEN TG_OP <> 'INSERT' THEN OLD.product_id END AS product_id
    ) affected
    WHERE product_id IS NOT NULL
  LOOP
    INSERT INTO public.product_stock (product_id, available, updated_at)
    VALUES (
      _product_id,
      (
        SELECT COUNT(*)
        FROM public.account_inventory ai
        WHERE ai.product_id = _product_id
          AND ai.status IN ('available', 'disponible')
          AND ai.seller_id IS NULL
      ),
      now()
    )
    ON CONFLICT (product_id)
    DO UPDATE SET available = EXCLUDED.available, updated_at = now();
  END LOOP;
  RETURN NULL;
END;
$$;

INSERT INTO public.product_stock (product_id, available, updated_at)
SELECT ai.product_id, COUNT(*)::int, now()
FROM public.account_inventory ai
WHERE ai.status IN ('available', 'disponible')
  AND ai.seller_id IS NULL
GROUP BY ai.product_id
ON CONFLICT (product_id)
DO UPDATE SET available = EXCLUDED.available, updated_at = now();

CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _account_id uuid;
  _user_id uuid;
  _paid boolean;
  _caller uuid := auth.uid();
  _is_admin boolean;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _is_admin := public.has_role(_caller, 'admin');

  SELECT user_id, COALESCE(payment_verified, false)
    INTO _user_id, _paid
  FROM public.orders
  WHERE id = _order_id;

  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  IF _user_id <> _caller AND NOT _is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT _paid AND NOT _is_admin THEN
    RETURN FALSE;
  END IF;

  SELECT id INTO _account_id
  FROM public.account_inventory
  WHERE product_id = _product_id
    AND status = 'available'
    AND seller_id IS NULL
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _account_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = _order_id, assigned_at = now()
  WHERE id = _account_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, _user_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = _account_id;

  UPDATE public.orders SET estado = 'entregado', updated_at = now() WHERE id = _order_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;
