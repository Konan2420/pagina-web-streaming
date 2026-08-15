-- Actualizar imágenes de Streaming
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Netflix%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1620332372374-f108c53d2e03?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Prime Video%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Disney%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%HBO%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1586899028174-e7001483f3c0?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Apple TV%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1611162617263-4cc3040af3ee?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%YouTube%';

-- Actualizar imágenes de IA
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%ChatGPT%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1707343843437-caacff5c6a74?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Gemini%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1684163762274-5bf7d020d57e?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Midjourney%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Microsoft%' OR name ILIKE '%Copilot%';

-- Actualizar imágenes de Música
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Spotify%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1514525253361-bee8718a300c?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Apple Music%';

-- Actualizar imágenes de Licencias
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Windows%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Adobe%';
UPDATE public.products SET image_url = 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800' WHERE name ILIKE '%Canva%';
