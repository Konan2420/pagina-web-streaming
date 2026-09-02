-- Catálogo inicial de Redes Sociales.
-- Los precios son referencias editables desde CMD ADMIN y el stock comienza vacío.

WITH social_products (
  name,
  description,
  descripcion_larga,
  price,
  image_url,
  category
) AS (
  VALUES
    (
      'Telegram Premium — 1 mes',
      'Acceso Telegram Premium por 1 mes.',
      'Producto digital de referencia para Telegram Premium. El administrador puede editar el precio, la descripción y cargar el stock o las credenciales correspondientes antes de venderlo.',
      12.00::numeric,
      'https://cdn.simpleicons.org/telegram/229ED9',
      'redes'
    ),
    (
      'Telegram Premium — 3 meses',
      'Acceso Telegram Premium por 3 meses.',
      'Producto digital de referencia para Telegram Premium. El administrador puede editar el precio, la descripción y cargar el stock o las credenciales correspondientes antes de venderlo.',
      32.00::numeric,
      'https://cdn.simpleicons.org/telegram/229ED9',
      'redes'
    ),
    (
      'Telegram Premium — 6 meses',
      'Acceso Telegram Premium por 6 meses.',
      'Producto digital de referencia para Telegram Premium. El administrador puede editar el precio, la descripción y cargar el stock o las credenciales correspondientes antes de venderlo.',
      60.00::numeric,
      'https://cdn.simpleicons.org/telegram/229ED9',
      'redes'
    ),
    (
      'Telegram Premium — 12 meses',
      'Acceso Telegram Premium por 12 meses.',
      'Producto digital de referencia para Telegram Premium. El administrador puede editar el precio, la descripción y cargar el stock o las credenciales correspondientes antes de venderlo.',
      110.00::numeric,
      'https://cdn.simpleicons.org/telegram/229ED9',
      'redes'
    ),
    (
      'Telegram Canal — 1,000 miembros',
      'Paquete referencial para un canal de Telegram.',
      'Servicio de referencia para canales de Telegram. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      25.00::numeric,
      'https://cdn.simpleicons.org/telegram/229ED9',
      'redes'
    ),
    (
      'Instagram — 1,000 seguidores',
      'Paquete referencial de 1,000 seguidores para Instagram.',
      'Servicio de referencia para Instagram. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      15.00::numeric,
      'https://cdn.simpleicons.org/instagram/E4405F',
      'redes'
    ),
    (
      'Instagram — 500 likes',
      'Paquete referencial de 500 likes para Instagram.',
      'Servicio de referencia para Instagram. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      8.00::numeric,
      'https://cdn.simpleicons.org/instagram/E4405F',
      'redes'
    ),
    (
      'Instagram Reels — 10,000 vistas',
      'Paquete referencial de 10,000 vistas para Reels.',
      'Servicio de referencia para Instagram Reels. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      12.00::numeric,
      'https://cdn.simpleicons.org/instagram/E4405F',
      'redes'
    ),
    (
      'Instagram Publicidad Básica',
      'Campaña publicitaria básica para Instagram.',
      'Servicio de publicidad de referencia para Instagram. El administrador define el alcance, las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      35.00::numeric,
      'https://cdn.simpleicons.org/instagram/E4405F',
      'redes'
    ),
    (
      'Cuenta de Instagram lista para usar',
      'Cuenta de Instagram con entrega desde stock.',
      'Producto de cuenta de referencia para Instagram. El administrador debe cargar una cuenta real en Stock Cuentas antes de habilitar su venta.',
      30.00::numeric,
      'https://cdn.simpleicons.org/instagram/E4405F',
      'redes'
    ),
    (
      'Facebook Página — 1,000 seguidores',
      'Paquete referencial de 1,000 seguidores para una página.',
      'Servicio de referencia para Facebook. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      18.00::numeric,
      'https://cdn.simpleicons.org/facebook/1877F2',
      'redes'
    ),
    (
      'Facebook Página — 500 likes',
      'Paquete referencial de 500 likes para una página.',
      'Servicio de referencia para Facebook. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      12.00::numeric,
      'https://cdn.simpleicons.org/facebook/1877F2',
      'redes'
    ),
    (
      'Facebook Videos — 10,000 vistas',
      'Paquete referencial de 10,000 vistas para videos.',
      'Servicio de referencia para Facebook. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      15.00::numeric,
      'https://cdn.simpleicons.org/facebook/1877F2',
      'redes'
    ),
    (
      'Facebook Publicidad Básica',
      'Campaña publicitaria básica para Facebook.',
      'Servicio de publicidad de referencia para Facebook. El administrador define el alcance, las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      40.00::numeric,
      'https://cdn.simpleicons.org/facebook/1877F2',
      'redes'
    ),
    (
      'Cuenta de Facebook lista para usar',
      'Cuenta de Facebook con entrega desde stock.',
      'Producto de cuenta de referencia para Facebook. El administrador debe cargar una cuenta real en Stock Cuentas antes de habilitar su venta.',
      30.00::numeric,
      'https://cdn.simpleicons.org/facebook/1877F2',
      'redes'
    ),
    (
      'TikTok — 1,000 seguidores',
      'Paquete referencial de 1,000 seguidores para TikTok.',
      'Servicio de referencia para TikTok. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      15.00::numeric,
      'https://cdn.simpleicons.org/tiktok/FFFFFF/010101',
      'redes'
    ),
    (
      'TikTok — 1,000 likes',
      'Paquete referencial de 1,000 likes para TikTok.',
      'Servicio de referencia para TikTok. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      10.00::numeric,
      'https://cdn.simpleicons.org/tiktok/FFFFFF/010101',
      'redes'
    ),
    (
      'TikTok — 10,000 vistas',
      'Paquete referencial de 10,000 vistas para TikTok.',
      'Servicio de referencia para TikTok. El administrador define las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      12.00::numeric,
      'https://cdn.simpleicons.org/tiktok/FFFFFF/010101',
      'redes'
    ),
    (
      'TikTok Publicidad Básica',
      'Campaña publicitaria básica para TikTok.',
      'Servicio de publicidad de referencia para TikTok. El administrador define el alcance, las condiciones finales, el precio y la disponibilidad antes de publicarlo para venta.',
      35.00::numeric,
      'https://cdn.simpleicons.org/tiktok/FFFFFF/010101',
      'redes'
    ),
    (
      'Cuenta de TikTok lista para usar',
      'Cuenta de TikTok con entrega desde stock.',
      'Producto de cuenta de referencia para TikTok. El administrador debe cargar una cuenta real en Stock Cuentas antes de habilitar su venta.',
      30.00::numeric,
      'https://cdn.simpleicons.org/tiktok/FFFFFF/010101',
      'redes'
    )
)
INSERT INTO public.products (name, description, descripcion_larga, price, image_url, category, is_active)
SELECT name, description, descripcion_larga, price, image_url, category, true
FROM social_products
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products existing_product
  WHERE existing_product.name = social_products.name
    AND existing_product.category = social_products.category
);
