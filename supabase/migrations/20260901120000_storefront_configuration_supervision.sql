-- Configuración visual de escaparates y supervisión administrativa auditada.
-- Los administradores no poseen una tienda propia: solo editan un escaparate comercial explícitamente seleccionado.

CREATE TABLE IF NOT EXISTS public.storefront_templates (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9-]{3,63}$'),
  name text NOT NULL,
  description text NOT NULL,
  is_premium boolean NOT NULL DEFAULT false,
  display_order smallint NOT NULL UNIQUE CHECK (display_order > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.storefront_templates (key, name, description, is_premium, display_order) VALUES
  ('premium-vogue', 'Premium: Vogue', 'Elegancia Serif', true, 1),
  ('premium-techpro', 'Premium: TechPro', 'Futurista', true, 2),
  ('premium-boutique', 'Premium: Boutique', 'Minimalista Pastel', true, 3),
  ('premium-executive', 'Premium: Executive', 'Corporativo', true, 4),
  ('premium-gaming', 'Premium: Gaming', 'Twitch Style', true, 5),
  ('premium-vintage', 'Premium: Vintage', 'Retro', true, 6),
  ('premium-arte-moderno', 'Premium: Arte Moderno', 'Syne', true, 7),
  ('premium-streetwear', 'Premium: Streetwear', 'Urbano', true, 8),
  ('premium-ecologico', 'Premium: Ecológico', 'Orgánico', true, 9),
  ('premium-royal', 'Premium: Royal', 'Realeza / Prestigio', true, 10),
  ('standard-professional', 'Estándar Profesional', 'CMD clásico', false, 11),
  ('netflix-red', 'Efecto Netflix', 'Rojo', false, 12),
  ('gaming-blue', 'Modo Gaming', 'Azul', false, 13),
  ('minimalist', 'Minimalista', 'Blanco / Negro', false, 14),
  ('neon-cyan', 'Estilo Neón', 'Cián', false, 15),
  ('gold-luxury', 'Lujo Dorado', 'Premium', false, 16),
  ('natura-green', 'Natura Verde', 'Orgánico', false, 17),
  ('cyberpunk', 'Cyberpunk', 'Amarillo / Magenta', false, 18),
  ('deep-ocean', 'Océano Profundo', 'Azul Marino', false, 19),
  ('sakura', 'Sakura', 'Rosa Japonés', false, 20),
  ('obsidian', 'Obsidiana', 'Gris Carbón', false, 21),
  ('aurora', 'Aurora Boreal', 'Verde / Púrpura', false, 22),
  ('desert', 'Desierto', 'Arena / Terracota', false, 23),
  ('midnight', 'Medianoche', 'Añil / Plata', false, 24),
  ('candy-pop', 'Candy Pop', 'Pastel Vibrante', false, 25),
  ('matrix', 'Matrix', 'Verde Terminal', false, 26),
  ('crimson-club', 'Crimson Club', 'Rojo Oscuro Elegante', false, 27),
  ('glacier', 'Glaciar', 'Blanco / Azul Frío', false, 28),
  ('volcanic', 'Volcánico', 'Naranja Lava', false, 29),
  ('velvet', 'Terciopelo', 'Púrpura Profundo', false, 30)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium,
  display_order = EXCLUDED.display_order;

ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS template_key text NOT NULL DEFAULT 'standard-professional' REFERENCES public.storefront_templates(key),
  ADD COLUMN IF NOT EXISTS avatar_frame_key text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS x_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.storefront_settings
  DROP CONSTRAINT IF EXISTS storefront_settings_avatar_frame_key_check,
  ADD CONSTRAINT storefront_settings_avatar_frame_key_check
    CHECK (avatar_frame_key IS NULL OR avatar_frame_key IN ('neon', 'fire', 'gold')),
  DROP CONSTRAINT IF EXISTS storefront_settings_facebook_url_check,
  ADD CONSTRAINT storefront_settings_facebook_url_check
    CHECK (facebook_url IS NULL OR facebook_url ~* '^https://[^[:space:]]+$'),
  DROP CONSTRAINT IF EXISTS storefront_settings_instagram_url_check,
  ADD CONSTRAINT storefront_settings_instagram_url_check
    CHECK (instagram_url IS NULL OR instagram_url ~* '^https://[^[:space:]]+$'),
  DROP CONSTRAINT IF EXISTS storefront_settings_tiktok_url_check,
  ADD CONSTRAINT storefront_settings_tiktok_url_check
    CHECK (tiktok_url IS NULL OR tiktok_url ~* '^https://[^[:space:]]+$'),
  DROP CONSTRAINT IF EXISTS storefront_settings_x_url_check,
  ADD CONSTRAINT storefront_settings_x_url_check
    CHECK (x_url IS NULL OR x_url ~* '^https://[^[:space:]]+$'),
  DROP CONSTRAINT IF EXISTS storefront_settings_youtube_url_check,
  ADD CONSTRAINT storefront_settings_youtube_url_check
    CHECK (youtube_url IS NULL OR youtube_url ~* '^https://[^[:space:]]+$');

UPDATE public.storefront_settings
SET last_published_at = COALESCE(last_published_at, updated_at),
    last_published_by = COALESCE(last_published_by, store_owner_id);

CREATE TABLE IF NOT EXISTS public.storefront_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  store_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('settings_published', 'product_override_saved', 'product_override_deleted', 'combo_created')),
  changed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS storefront_admin_audit_owner_created_idx
  ON public.storefront_admin_audit_log (store_owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS storefront_admin_audit_admin_created_idx
  ON public.storefront_admin_audit_log (admin_id, created_at DESC);

ALTER TABLE public.storefront_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_admin_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.storefront_templates, public.storefront_admin_audit_log FROM anon;
GRANT SELECT ON public.storefront_templates TO authenticated, anon;
GRANT SELECT ON public.storefront_admin_audit_log TO authenticated;
GRANT ALL ON public.storefront_templates, public.storefront_admin_audit_log TO service_role;

DROP POLICY IF EXISTS "Anyone can read storefront templates" ON public.storefront_templates;
CREATE POLICY "Anyone can read storefront templates"
ON public.storefront_templates FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins read storefront edit audit" ON public.storefront_admin_audit_log;
CREATE POLICY "Admins read storefront edit audit"
ON public.storefront_admin_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Los dueños comerciales mantienen acceso directo únicamente a su propio escaparate.
-- El administrador no recibe UPDATE directo: la publicación remota usa la función auditada de abajo.
DROP POLICY IF EXISTS "Store owners and admins manage storefront settings" ON public.storefront_settings;
DROP POLICY IF EXISTS "Commercial owners manage own storefront settings" ON public.storefront_settings;
DROP POLICY IF EXISTS "Admins supervise storefront settings" ON public.storefront_settings;
CREATE POLICY "Commercial owners manage own storefront settings"
ON public.storefront_settings FOR ALL TO authenticated
USING (
  auth.uid() = store_owner_id
  AND (public.has_role(auth.uid(), 'proveedor'::public.app_role) OR public.has_role(auth.uid(), 'distribuidor'::public.app_role))
)
WITH CHECK (
  auth.uid() = store_owner_id
  AND (public.has_role(auth.uid(), 'proveedor'::public.app_role) OR public.has_role(auth.uid(), 'distribuidor'::public.app_role))
);
CREATE POLICY "Admins supervise storefront settings"
ON public.storefront_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.publish_storefront_settings(
  p_owner_id uuid,
  p_store_slug text,
  p_display_name text,
  p_description text,
  p_logo_url text,
  p_banner_url text,
  p_is_public boolean,
  p_availability_mode text,
  p_is_available boolean,
  p_opens_at time,
  p_closes_at time,
  p_timezone text,
  p_template_key text,
  p_avatar_frame_key text,
  p_facebook_url text,
  p_instagram_url text,
  p_tiktok_url text,
  p_x_url text,
  p_youtube_url text
)
RETURNS public.storefront_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  actor_is_admin boolean;
  owner_is_commercial boolean;
  previous_row public.storefront_settings%ROWTYPE;
  saved_row public.storefront_settings%ROWTYPE;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to publish storefront settings';
  END IF;

  actor_is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  owner_is_commercial := public.has_role(p_owner_id, 'proveedor'::public.app_role)
    OR public.has_role(p_owner_id, 'distribuidor'::public.app_role);
  IF NOT owner_is_commercial THEN
    RAISE EXCEPTION 'Only provider or distributor storefronts can be configured';
  END IF;
  IF actor_id <> p_owner_id AND NOT actor_is_admin THEN
    RAISE EXCEPTION 'You cannot publish another storefront';
  END IF;
  IF actor_id = p_owner_id AND NOT owner_is_commercial THEN
    RAISE EXCEPTION 'Only providers and distributors can publish a storefront';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.storefront_templates WHERE key = p_template_key) THEN
    RAISE EXCEPTION 'The selected storefront template is invalid';
  END IF;

  SELECT * INTO previous_row FROM public.storefront_settings WHERE store_owner_id = p_owner_id FOR UPDATE;

  INSERT INTO public.storefront_settings (
    store_owner_id, store_slug, display_name, description, logo_url, banner_url,
    is_public, availability_mode, is_available, opens_at, closes_at, timezone,
    template_key, avatar_frame_key, facebook_url, instagram_url, tiktok_url, x_url, youtube_url,
    last_published_at, last_published_by
  ) VALUES (
    p_owner_id, lower(btrim(p_store_slug)), btrim(p_display_name), NULLIF(btrim(p_description), ''), NULLIF(btrim(p_logo_url), ''), NULLIF(btrim(p_banner_url), ''),
    p_is_public, p_availability_mode, p_is_available, p_opens_at, p_closes_at, p_timezone,
    p_template_key, p_avatar_frame_key, NULLIF(btrim(p_facebook_url), ''), NULLIF(btrim(p_instagram_url), ''), NULLIF(btrim(p_tiktok_url), ''), NULLIF(btrim(p_x_url), ''), NULLIF(btrim(p_youtube_url), ''),
    now(), actor_id
  )
  ON CONFLICT (store_owner_id) DO UPDATE SET
    store_slug = EXCLUDED.store_slug,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    is_public = EXCLUDED.is_public,
    availability_mode = EXCLUDED.availability_mode,
    is_available = EXCLUDED.is_available,
    opens_at = EXCLUDED.opens_at,
    closes_at = EXCLUDED.closes_at,
    timezone = EXCLUDED.timezone,
    template_key = EXCLUDED.template_key,
    avatar_frame_key = EXCLUDED.avatar_frame_key,
    facebook_url = EXCLUDED.facebook_url,
    instagram_url = EXCLUDED.instagram_url,
    tiktok_url = EXCLUDED.tiktok_url,
    x_url = EXCLUDED.x_url,
    youtube_url = EXCLUDED.youtube_url,
    last_published_at = EXCLUDED.last_published_at,
    last_published_by = EXCLUDED.last_published_by
  RETURNING * INTO saved_row;

  IF actor_is_admin AND actor_id <> p_owner_id THEN
    INSERT INTO public.storefront_admin_audit_log (admin_id, store_owner_id, action, changed_fields)
    VALUES (
      actor_id,
      p_owner_id,
      'settings_published',
      jsonb_build_object(
        'before', COALESCE(to_jsonb(previous_row), '{}'::jsonb),
        'after', to_jsonb(saved_row)
      )
    );
  END IF;
  RETURN saved_row;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_storefront_settings(uuid, text, text, text, text, text, boolean, text, boolean, time, time, text, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_storefront_settings(uuid, text, text, text, text, text, boolean, text, boolean, time, time, text, text, text, text, text, text, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_storefront_supervision_list()
RETURNS TABLE (
  owner_id uuid,
  owner_name text,
  owner_role text,
  logo_url text,
  template_key text,
  is_public boolean,
  last_published_at timestamptz,
  product_count bigint,
  total_sales bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only administrators can supervise storefronts';
  END IF;
  RETURN QUERY
  WITH commercial_owners AS (
    SELECT role_row.user_id, min(role_row.role::text) AS role
    FROM public.user_roles AS role_row
    WHERE role_row.role IN ('proveedor'::public.app_role, 'distribuidor'::public.app_role)
    GROUP BY role_row.user_id
  ), product_counts AS (
    SELECT override.store_owner_id, count(*)::bigint AS product_count
    FROM public.store_product_overrides AS override
    WHERE override.is_visible
    GROUP BY override.store_owner_id
  ), sales AS (
    SELECT order_row.storefront_owner_id, count(*)::bigint AS total_sales
    FROM public.orders AS order_row
    WHERE order_row.storefront_owner_id IS NOT NULL AND order_row.estado <> 'cancelado'
    GROUP BY order_row.storefront_owner_id
  )
  SELECT
    commercial.user_id,
    COALESCE(NULLIF(supplier.display_name, ''), NULLIF(distributor.display_name, ''), NULLIF(profile.nombre_completo, ''), 'Tienda'),
    commercial.role,
    settings.logo_url,
    COALESCE(settings.template_key, 'standard-professional'),
    COALESCE(settings.is_public, false),
    settings.last_published_at,
    COALESCE(product_counts.product_count, 0),
    COALESCE(sales.total_sales, 0)
  FROM commercial_owners AS commercial
  LEFT JOIN public.profiles AS profile ON profile.id = commercial.user_id
  LEFT JOIN public.supplier_profiles AS supplier ON supplier.user_id = commercial.user_id
  LEFT JOIN public.distributor_profiles AS distributor ON distributor.user_id = commercial.user_id
  LEFT JOIN public.storefront_settings AS settings ON settings.store_owner_id = commercial.user_id
  LEFT JOIN product_counts ON product_counts.store_owner_id = commercial.user_id
  LEFT JOIN sales ON sales.storefront_owner_id = commercial.user_id
  ORDER BY 2, 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_storefront_supervision_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_storefront_supervision_list() TO authenticated, service_role;
