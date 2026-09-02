-- Identificador opcional de un ícono predefinido del catálogo frontend.
-- Se mantiene independiente de image_url para conservar las portadas existentes.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS icon_id text;

COMMENT ON COLUMN public.products.icon_id IS
  'ID del ícono predefinido definido en src/lib/platformIcons.tsx.';
