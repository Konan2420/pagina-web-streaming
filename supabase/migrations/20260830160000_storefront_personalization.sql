-- Tiendas de reventa: las personalizaciones nunca alteran el catálogo maestro.
CREATE TABLE IF NOT EXISTS public.storefront_settings (
  store_owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_slug text NOT NULL UNIQUE CHECK (store_slug ~ '^[a-z0-9][a-z0-9-]{2,62}$'),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 2 AND 100),
  description text,
  logo_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fuente privada de costo para el catálogo maestro. `products.price` permanece
-- público y no se reutiliza como un costo editable por revendedores.
CREATE TABLE IF NOT EXISTS public.catalog_product_costs (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  unit_cost_pen numeric(16, 6) NOT NULL CHECK (unit_cost_pen >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- El catálogo histórico no tenía una columna mayorista. Se establece su precio
-- actual como costo inicial una sola vez; desde ahora esta tabla es la fuente
-- privada que el administrador puede ajustar sin publicar el costo.
INSERT INTO public.catalog_product_costs (product_id, unit_cost_pen)
SELECT id, price
FROM public.products
ON CONFLICT (product_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.initialize_catalog_product_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.catalog_product_costs (product_id, unit_cost_pen)
  VALUES (NEW.id, NEW.price)
  ON CONFLICT (product_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_initialize_catalog_product_cost ON public.products;
CREATE TRIGGER products_initialize_catalog_product_cost
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.initialize_catalog_product_cost();

CREATE TABLE IF NOT EXISTS public.store_product_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('master_catalog', 'smm_generator')),
  master_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  social_service_id uuid REFERENCES public.social_service_catalog(id) ON DELETE CASCADE,
  custom_name text,
  custom_description text,
  sale_price_pen numeric(16, 2) CHECK (sale_price_pen IS NULL OR sale_price_pen >= 0),
  promo_price_pen numeric(16, 2) CHECK (promo_price_pen IS NULL OR promo_price_pen >= 0),
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_product_overrides_exactly_one_source CHECK (
    (source_type = 'master_catalog' AND master_product_id IS NOT NULL AND social_service_id IS NULL)
    OR (source_type = 'smm_generator' AND social_service_id IS NOT NULL AND master_product_id IS NULL)
  ),
  CONSTRAINT store_product_overrides_promo_not_higher CHECK (
    promo_price_pen IS NULL OR sale_price_pen IS NULL OR promo_price_pen <= sale_price_pen
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS store_product_overrides_master_source_key
  ON public.store_product_overrides (store_owner_id, master_product_id)
  WHERE master_product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS store_product_overrides_smm_source_key
  ON public.store_product_overrides (store_owner_id, social_service_id)
  WHERE social_service_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS store_product_overrides_owner_updated_idx
  ON public.store_product_overrides (store_owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.store_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 140),
  description text,
  sale_price_pen numeric(16, 2) NOT NULL CHECK (sale_price_pen >= 0),
  promo_price_pen numeric(16, 2) CHECK (promo_price_pen IS NULL OR promo_price_pen >= 0),
  is_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_combos_promo_not_higher CHECK (
    promo_price_pen IS NULL OR promo_price_pen <= sale_price_pen
  )
);

CREATE TABLE IF NOT EXISTS public.store_combo_items (
  combo_id uuid NOT NULL REFERENCES public.store_combos(id) ON DELETE CASCADE,
  store_product_override_id uuid NOT NULL REFERENCES public.store_product_overrides(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (combo_id, store_product_override_id)
);

CREATE INDEX IF NOT EXISTS store_combos_owner_updated_idx
  ON public.store_combos (store_owner_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_storefront_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS storefront_settings_set_updated_at ON public.storefront_settings;
CREATE TRIGGER storefront_settings_set_updated_at
BEFORE UPDATE ON public.storefront_settings
FOR EACH ROW EXECUTE FUNCTION public.set_storefront_updated_at();

DROP TRIGGER IF EXISTS catalog_product_costs_set_updated_at ON public.catalog_product_costs;
CREATE TRIGGER catalog_product_costs_set_updated_at
BEFORE UPDATE ON public.catalog_product_costs
FOR EACH ROW EXECUTE FUNCTION public.set_storefront_updated_at();

DROP TRIGGER IF EXISTS store_product_overrides_set_updated_at ON public.store_product_overrides;
CREATE TRIGGER store_product_overrides_set_updated_at
BEFORE UPDATE ON public.store_product_overrides
FOR EACH ROW EXECUTE FUNCTION public.set_storefront_updated_at();

DROP TRIGGER IF EXISTS store_combos_set_updated_at ON public.store_combos;
CREATE TRIGGER store_combos_set_updated_at
BEFORE UPDATE ON public.store_combos
FOR EACH ROW EXECUTE FUNCTION public.set_storefront_updated_at();

ALTER TABLE public.storefront_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_product_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_combo_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_manage_storefront(_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR (
      auth.uid() = _owner_id
      AND (
        public.has_role(auth.uid(), 'proveedor')
        OR public.has_role(auth.uid(), 'distribuidor')
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_manage_storefront(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_storefront(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Store owners and admins manage storefront settings" ON public.storefront_settings;
CREATE POLICY "Store owners and admins manage storefront settings"
ON public.storefront_settings FOR ALL TO authenticated
USING (public.can_manage_storefront(store_owner_id))
WITH CHECK (public.can_manage_storefront(store_owner_id));

DROP POLICY IF EXISTS "Store owners and admins manage product overrides" ON public.store_product_overrides;
CREATE POLICY "Store owners and admins manage product overrides"
ON public.store_product_overrides FOR ALL TO authenticated
USING (public.can_manage_storefront(store_owner_id))
WITH CHECK (public.can_manage_storefront(store_owner_id));

DROP POLICY IF EXISTS "Store owners and admins manage combos" ON public.store_combos;
CREATE POLICY "Store owners and admins manage combos"
ON public.store_combos FOR ALL TO authenticated
USING (public.can_manage_storefront(store_owner_id))
WITH CHECK (public.can_manage_storefront(store_owner_id));

DROP POLICY IF EXISTS "Store owners and admins manage combo items" ON public.store_combo_items;
CREATE POLICY "Store owners and admins manage combo items"
ON public.store_combo_items FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.store_combos combo
    WHERE combo.id = store_combo_items.combo_id
      AND public.can_manage_storefront(combo.store_owner_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_combos combo
    JOIN public.store_product_overrides item
      ON item.id = store_combo_items.store_product_override_id
    WHERE combo.id = store_combo_items.combo_id
      AND combo.store_owner_id = item.store_owner_id
      AND public.can_manage_storefront(combo.store_owner_id)
  )
);

DROP POLICY IF EXISTS "Admins manage catalog product costs" ON public.catalog_product_costs;
CREATE POLICY "Admins manage catalog product costs"
ON public.catalog_product_costs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.storefront_settings, public.store_product_overrides, public.store_combos, public.store_combo_items, public.catalog_product_costs FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_settings, public.store_product_overrides, public.store_combos, public.store_combo_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_product_costs TO authenticated;
GRANT ALL ON public.storefront_settings, public.store_product_overrides, public.store_combos, public.store_combo_items, public.catalog_product_costs TO service_role;

COMMENT ON TABLE public.store_product_overrides
IS 'Per-store presentation and sale-price overrides. It never stores the origin cost or profit.';
COMMENT ON TABLE public.catalog_product_costs
IS 'Private source of wholesale/master costs. It is intentionally unavailable to browser clients.';
