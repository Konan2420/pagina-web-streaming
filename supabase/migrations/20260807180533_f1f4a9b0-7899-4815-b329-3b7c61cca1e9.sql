-- Delete existing products with these names or old variations first to ensure a clean state
DELETE FROM public.products 
WHERE name IN (
  'Netflix Premium 4K', 'Prime Video', 'Disney+', 'Disney+ Anual', 
  'HBO Max', 'HBO Max Estándar', 'Apple TV', 'Paramount+', 
  'Crunchyroll', 'Crunchyroll Fan', 'YouTube Premium', 'Youtube Premium',
  'Spotify', 'Spotify Premium', 'ViX Premium', 'MUBI'
);

-- Insert the updated list
INSERT INTO public.products (name, price, description, category, is_active, image_url) VALUES
('Netflix Premium 4K', 15.00, 'NETFLIX PREMIUM — PERFIL X 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&q=80'),
('Prime Video', 10.00, 'PRIME VIDEO — PERFIL 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1620332372374-f108c53d2e03?w=500&q=80'),
('Disney+', 45.00, 'DISNEY+ — CUENTA COMPLETA 12 MESES', 'streaming', true, 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80'),
('HBO Max', 12.00, 'HBO MAX — PERFIL 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&q=80'),
('Apple TV', 15.00, 'APPLE TV — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1586899028174-e7001483f3c0?w=500&q=80'),
('Paramount+', 9.00, 'PARAMOUNT+ — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80'),
('Crunchyroll', 7.00, 'CRUNCHYROLL — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=500&q=80'),
('YouTube Premium', 10.00, 'YOUTUBE PREMIUM — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1611162617263-4cc3040af3ee?w=500&q=80'),
('Spotify', 8.00, 'SPOTIFY PREMIUM — 30 DÍAS', 'music', true, 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80'),
('ViX Premium', 12.00, 'VIX PREMIUM — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&q=80'),
('MUBI', 10.00, 'MUBI — 30 DÍAS', 'streaming', true, 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80');
