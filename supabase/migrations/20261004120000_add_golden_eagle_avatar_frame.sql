-- Marco de águila dorada con centro y exterior transparentes.
INSERT INTO public.avatar_frames
  (key, name, category, asset_url, renderer, animation_type, animation_config, access_type, display_order)
VALUES
  (
    'golden-eagle',
    'Águila Dorada',
    'animales',
    '/avatar-frames/golden-eagle.png',
    'image',
    'glow',
    '{"fit": "cover", "inset": "-30%"}'::jsonb,
    'free',
    185
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
