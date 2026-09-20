-- Valor de arranque para productos creados antes de los metadatos de catálogo.
-- Solo se completa el caso totalmente sin declarar; no se sobrescriben decisiones
-- parciales o valores corregidos manualmente.
UPDATE public.products
SET delivery_type = 'completa',
    scope_type = 'global',
    scope_country = NULL
WHERE delivery_type IS NULL
  AND scope_type IS NULL;
