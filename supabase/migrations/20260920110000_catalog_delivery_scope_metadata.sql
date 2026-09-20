-- Metadatos comerciales declarados por el vendedor para las tarjetas del catálogo.
-- Se dejan NULL para los productos existentes: NULL significa "sin declarar".
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_type text,
  ADD COLUMN IF NOT EXISTS scope_type text,
  ADD COLUMN IF NOT EXISTS scope_country text;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_delivery_type_check,
  ADD CONSTRAINT products_delivery_type_check
    CHECK (delivery_type IS NULL OR delivery_type IN ('manual', 'completa', 'perfil')),
  DROP CONSTRAINT IF EXISTS products_scope_type_check,
  ADD CONSTRAINT products_scope_type_check
    CHECK (scope_type IS NULL OR scope_type IN ('global', 'pais_especifico')),
  DROP CONSTRAINT IF EXISTS products_scope_country_check,
  ADD CONSTRAINT products_scope_country_check
    CHECK (scope_country IS NULL OR scope_country ~ '^[A-Z]{2}$'),
  DROP CONSTRAINT IF EXISTS products_scope_pair_check,
  ADD CONSTRAINT products_scope_pair_check
    CHECK (
      (scope_type IS NULL AND scope_country IS NULL)
      OR (scope_type = 'global' AND scope_country IS NULL)
      OR (scope_type = 'pais_especifico' AND scope_country IS NOT NULL)
    );

COMMENT ON COLUMN public.products.delivery_type IS
  'Tipo de entrega declarado: manual, completa o perfil; NULL = sin declarar.';
COMMENT ON COLUMN public.products.scope_type IS
  'Alcance declarado: global o pais_especifico; NULL = sin declarar.';
COMMENT ON COLUMN public.products.scope_country IS
  'Código ISO 3166-1 alpha-2 cuando scope_type = pais_especifico.';
