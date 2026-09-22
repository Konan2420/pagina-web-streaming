-- El catálogo de marcos es la fuente de verdad para las claves persistidas.
-- Se mantienen explícitamente las claves históricas para retrocompatibilidad.
INSERT INTO public.avatar_frames
  (key, name, category, renderer, animation_type, access_type, display_order)
VALUES
  ('neon', 'Neón Circuit', 'animados', 'svg', 'glow', 'free', 10),
  ('fire', 'Anillo Ember', 'elementales', 'svg', 'glow', 'free', 40),
  ('gold', 'Corona Solar', 'elementales', 'svg', 'glow', 'free', 80)
ON CONFLICT (key) DO UPDATE SET
  is_active = true,
  updated_at = now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.storefront_settings AS settings
    WHERE settings.avatar_frame_key IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.avatar_frames AS frames
        WHERE frames.key = settings.avatar_frame_key
      )
  ) THEN
    RAISE EXCEPTION 'Existen avatar_frame_key sin correspondencia en avatar_frames';
  END IF;
END;
$$;

ALTER TABLE public.storefront_settings
  DROP CONSTRAINT IF EXISTS storefront_settings_avatar_frame_key_check,
  DROP CONSTRAINT IF EXISTS storefront_settings_avatar_frame_key_fkey;

ALTER TABLE public.storefront_settings
  ADD CONSTRAINT storefront_settings_avatar_frame_key_fkey
  FOREIGN KEY (avatar_frame_key)
  REFERENCES public.avatar_frames(key)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

COMMENT ON COLUMN public.storefront_settings.avatar_frame_key IS
  'Clave legible del marco; validada dinámicamente contra avatar_frames.key.';
