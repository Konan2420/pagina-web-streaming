-- account_type y access_scope dejan de tener valor por defecto.
--
-- Las dos columnas se crearon con `NOT NULL DEFAULT 'completa'` / `'global'` y
-- ninguna interfaz llegó a escribirlas nunca, así que el catálogo publicaba el
-- valor más favorable posible sobre TODOS los productos como si el vendedor lo
-- hubiera declarado. La tarjeta ya sabe no pintar nada cuando el valor no está
-- (`toAccountType` / `toAccessScope` devuelven nulo), pero con el DEFAULT puesto
-- ese camino era inalcanzable: el valor por defecto es uno de los admitidos.
--
-- A partir de aquí el silencio es un estado legítimo de la columna. El CHECK no
-- cambia —una restricción CHECK se cumple con NULL—, así que los valores siguen
-- estando limitados a los dos admitidos cuando existen.

ALTER TABLE public.products
  ALTER COLUMN account_type DROP DEFAULT,
  ALTER COLUMN account_type DROP NOT NULL,
  ALTER COLUMN access_scope DROP DEFAULT,
  ALTER COLUMN access_scope DROP NOT NULL;

-- Lo almacenado es el DEFAULT de la columna en todas las filas: vaciarlo no
-- pierde ninguna declaración, solo deja de publicar una que nadie hizo. La tabla
-- es un catálogo de decenas de filas, no hace falta trocear el UPDATE.
UPDATE public.products
SET account_type = NULL,
    access_scope = NULL
WHERE account_type IS NOT NULL
   OR access_scope IS NOT NULL;

COMMENT ON COLUMN public.products.account_type IS
  'Presentation label in the catalogue: completa or perfil. NULL means the seller has not declared it and the card shows no chip.';

COMMENT ON COLUMN public.products.access_scope IS
  'Availability scope in the catalogue: global or regional. NULL means the seller has not declared it and the card shows no chip.';
