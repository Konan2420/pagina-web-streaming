-- Catálogo seguro y reutilizable de marcos de avatar.
CREATE TABLE IF NOT EXISTS public.avatar_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE CHECK (key ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  category text NOT NULL CHECK (category IN ('animados', 'elementales', 'naturaleza', 'festivos', 'animales')),
  asset_url text,
  renderer text NOT NULL DEFAULT 'svg' CHECK (renderer IN ('css', 'svg')),
  animation_type text NOT NULL CHECK (animation_type IN ('rotate', 'pulse', 'particles', 'glow', 'float')),
  animation_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  access_type text NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'plan', 'role')),
  required_plan text,
  required_role text CHECK (required_role IS NULL OR required_role IN ('admin', 'proveedor', 'distribuidor')),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.avatar_frames
  (key, name, category, renderer, animation_type, animation_config, access_type, display_order)
VALUES
  ('neon', 'Neón Circuit', 'animados', 'svg', 'glow', '{"duration": 4.8, "intensity": 0.85}', 'free', 10),
  ('prisma-orbit', 'Órbita Prisma', 'animados', 'svg', 'rotate', '{"duration": 14}', 'free', 20),
  ('aurora-halo', 'Halo Aurora', 'animados', 'svg', 'pulse', '{"duration": 4.2}', 'free', 30),
  ('fire', 'Anillo Ember', 'elementales', 'svg', 'glow', '{"duration": 2.8, "intensity": 0.95}', 'free', 40),
  ('frost-halo', 'Halo Escarcha', 'elementales', 'svg', 'float', '{"duration": 5.5}', 'free', 50),
  ('aqua-tide', 'Marea Aqua', 'elementales', 'svg', 'particles', '{"duration": 5.2}', 'free', 60),
  ('verdant-bloom', 'Florecer Verde', 'elementales', 'svg', 'pulse', '{"duration": 4.6}', 'free', 70),
  ('gold', 'Corona Solar', 'elementales', 'svg', 'glow', '{"duration": 3.6, "intensity": 0.9}', 'free', 80),
  ('petal-wreath', 'Guirnalda de Pétalos', 'naturaleza', 'svg', 'float', '{"duration": 6.2}', 'free', 90),
  ('moon-garden', 'Jardín Lunar', 'naturaleza', 'svg', 'particles', '{"duration": 6.8}', 'free', 100),
  ('crystal-vine', 'Enredadera Cristal', 'naturaleza', 'svg', 'rotate', '{"duration": 18}', 'free', 110),
  ('celebration-ribbon', 'Cinta Celebración', 'festivos', 'svg', 'float', '{"duration": 4.8}', 'free', 120),
  ('candy-spark', 'Destello Candy', 'festivos', 'svg', 'pulse', '{"duration": 3.2}', 'free', 130),
  ('winter-glow', 'Brillo Invernal', 'festivos', 'svg', 'glow', '{"duration": 4.2}', 'free', 140),
  ('cat-ears', 'Orejas Gato', 'animales', 'svg', 'pulse', '{"duration": 4.5}', 'free', 150),
  ('fox-ears', 'Orejas Zorro', 'animales', 'svg', 'glow', '{"duration": 4.1}', 'free', 160),
  ('bunny-ears', 'Orejas Conejo', 'animales', 'svg', 'float', '{"duration": 5.4}', 'free', 170),
  ('bear-hood', 'Capucha Oso', 'animales', 'svg', 'pulse', '{"duration": 4.8}', 'free', 180)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  renderer = EXCLUDED.renderer,
  animation_type = EXCLUDED.animation_type,
  animation_config = EXCLUDED.animation_config,
  access_type = EXCLUDED.access_type,
  display_order = EXCLUDED.display_order,
  updated_at = now();

ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS selected_frame_id uuid REFERENCES public.avatar_frames(id) ON DELETE SET NULL;

ALTER TABLE public.storefront_settings
  DROP CONSTRAINT IF EXISTS storefront_settings_avatar_frame_key_check,
  ADD CONSTRAINT storefront_settings_avatar_frame_key_check
    CHECK (avatar_frame_key IS NULL OR avatar_frame_key IN (
      'neon', 'prisma-orbit', 'aurora-halo', 'fire', 'frost-halo', 'aqua-tide',
      'verdant-bloom', 'gold', 'petal-wreath', 'moon-garden', 'crystal-vine',
      'celebration-ribbon', 'candy-spark', 'winter-glow', 'cat-ears', 'fox-ears',
      'bunny-ears', 'bear-hood'
    ));

UPDATE public.storefront_settings settings
SET selected_frame_id = frames.id
FROM public.avatar_frames frames
WHERE frames.key = settings.avatar_frame_key
  AND settings.selected_frame_id IS NULL;

CREATE OR REPLACE FUNCTION public.sync_storefront_avatar_frame()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.avatar_frame_key IS NULL THEN
      NEW.selected_frame_id := NULL;
    ELSE
      SELECT id INTO NEW.selected_frame_id
      FROM public.avatar_frames
      WHERE key = NEW.avatar_frame_key AND is_active;
      IF NEW.selected_frame_id IS NULL THEN
        RAISE EXCEPTION 'The selected avatar frame is invalid';
      END IF;
    END IF;
  ELSIF NEW.avatar_frame_key IS DISTINCT FROM OLD.avatar_frame_key THEN
    IF NEW.avatar_frame_key IS NULL THEN
      NEW.selected_frame_id := NULL;
    ELSE
      SELECT id INTO NEW.selected_frame_id
      FROM public.avatar_frames
      WHERE key = NEW.avatar_frame_key AND is_active;
      IF NEW.selected_frame_id IS NULL THEN
        RAISE EXCEPTION 'The selected avatar frame is invalid';
      END IF;
    END IF;
  ELSIF NEW.selected_frame_id IS DISTINCT FROM OLD.selected_frame_id THEN
    IF NEW.selected_frame_id IS NULL THEN
      NEW.avatar_frame_key := NULL;
    ELSE
      SELECT key INTO NEW.avatar_frame_key
      FROM public.avatar_frames
      WHERE id = NEW.selected_frame_id AND is_active;
      IF NEW.avatar_frame_key IS NULL THEN
        RAISE EXCEPTION 'The selected avatar frame is invalid';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS storefront_settings_sync_avatar_frame ON public.storefront_settings;
CREATE TRIGGER storefront_settings_sync_avatar_frame
BEFORE INSERT OR UPDATE OF avatar_frame_key, selected_frame_id ON public.storefront_settings
FOR EACH ROW EXECUTE FUNCTION public.sync_storefront_avatar_frame();

ALTER TABLE public.avatar_frames ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users read active avatar frames" ON public.avatar_frames;
CREATE POLICY "Authenticated users read active avatar frames"
ON public.avatar_frames FOR SELECT TO authenticated
USING (is_active);

DROP POLICY IF EXISTS "Admins manage avatar frames" ON public.avatar_frames;
CREATE POLICY "Admins manage avatar frames"
ON public.avatar_frames FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.avatar_frames FROM anon;
GRANT SELECT ON public.avatar_frames TO authenticated;
GRANT ALL ON public.avatar_frames TO service_role;

COMMENT ON TABLE public.avatar_frames IS
  'Catálogo maestro de marcos originales de avatar renderizados con CSS/SVG.';
COMMENT ON COLUMN public.storefront_settings.selected_frame_id IS
  'Marco activo de la tienda; avatar_frame_key se conserva temporalmente por compatibilidad.';
