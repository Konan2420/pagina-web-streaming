-- Marco animado transparente de mariposas para el catálogo de avatar.
-- El GIF se sirve como asset público versionado junto a la aplicación.
ALTER TABLE public.avatar_frames
  DROP CONSTRAINT IF EXISTS avatar_frames_renderer_check;

ALTER TABLE public.avatar_frames
  ADD CONSTRAINT avatar_frames_renderer_check
  CHECK (renderer IN ('css', 'svg', 'image', 'gif'));

INSERT INTO public.avatar_frames
  (key, name, category, asset_url, renderer, animation_type, animation_config, access_type, display_order)
VALUES
  (
    'butterfly-spark',
    'Mariposas Spark',
    'naturaleza',
    '/avatar-frames/butterfly-spark.gif',
    'gif',
    'float',
    '{"fit": "contain", "inset": "-11%"}'::jsonb,
    'free',
    115
  )
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  asset_url = EXCLUDED.asset_url,
  renderer = EXCLUDED.renderer,
  animation_type = EXCLUDED.animation_type,
  animation_config = EXCLUDED.animation_config,
  access_type = EXCLUDED.access_type,
  display_order = EXCLUDED.display_order,
  is_active = true,
  updated_at = now();
