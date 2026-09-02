-- Metadatos públicos y seguros para las tarjetas del catálogo.
-- No se exponen correos, credenciales ni otros datos privados: solo el nombre
-- comercial que ya autoriza cada perfil para publicar productos.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'completa',
  ADD COLUMN IF NOT EXISTS access_scope text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS publisher_name text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_account_type_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_account_type_check
      CHECK (account_type IN ('completa', 'perfil'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_access_scope_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_access_scope_check
      CHECK (access_scope IN ('global', 'regional'));
  END IF;
END;
$$;

-- Recupera el nombre comercial de productos ya asociados a un proveedor o
-- distribuidor. Se conserva nulo si el producto pertenece a CMD Streaming;
-- el frontend mostrará entonces el mensaje de primera compra hasta que exista
-- una venta confirmada.
UPDATE public.products AS product
SET publisher_name = supplier.display_name
FROM public.supplier_profiles AS supplier
WHERE product.supplier_id = supplier.user_id
  AND NULLIF(BTRIM(supplier.display_name), '') IS NOT NULL;

UPDATE public.products AS product
SET publisher_name = distributor.display_name
FROM public.distributor_profiles AS distributor
WHERE product.supplier_id = distributor.user_id
  AND product.publisher_name IS NULL
  AND NULLIF(BTRIM(distributor.display_name), '') IS NOT NULL;

-- Cuando cambia el autor asignado a un producto, sincroniza el único dato
-- público necesario para la tarjeta. Si no existe perfil comercial, no se
-- inventa un nombre.
CREATE OR REPLACE FUNCTION public.sync_catalog_product_publisher_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  resolved_name text;
BEGIN
  IF NEW.supplier_id IS NULL THEN
    NEW.publisher_name := NULL;
    RETURN NEW;
  END IF;

  SELECT display_name
  INTO resolved_name
  FROM public.supplier_profiles
  WHERE user_id = NEW.supplier_id;

  IF resolved_name IS NULL THEN
    SELECT display_name
    INTO resolved_name
    FROM public.distributor_profiles
    WHERE user_id = NEW.supplier_id;
  END IF;

  NEW.publisher_name := NULLIF(BTRIM(resolved_name), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_sync_catalog_publisher_name ON public.products;
CREATE TRIGGER products_sync_catalog_publisher_name
BEFORE INSERT OR UPDATE OF supplier_id ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.sync_catalog_product_publisher_name();

-- Mantiene el nombre visible al día cuando el perfil comercial se renombra.
CREATE OR REPLACE FUNCTION public.sync_catalog_products_from_supplier_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET publisher_name = NULLIF(BTRIM(NEW.display_name), '')
  WHERE supplier_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supplier_profiles_sync_catalog_publisher_name ON public.supplier_profiles;
CREATE TRIGGER supplier_profiles_sync_catalog_publisher_name
AFTER INSERT OR UPDATE OF display_name ON public.supplier_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_catalog_products_from_supplier_profile();

CREATE OR REPLACE FUNCTION public.sync_catalog_products_from_distributor_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Si coexistieran ambos perfiles, la identidad de proveedor tiene prioridad.
  UPDATE public.products AS product
  SET publisher_name = NULLIF(BTRIM(NEW.display_name), '')
  WHERE product.supplier_id = NEW.user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.supplier_profiles AS supplier
      WHERE supplier.user_id = NEW.user_id
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS distributor_profiles_sync_catalog_publisher_name ON public.distributor_profiles;
CREATE TRIGGER distributor_profiles_sync_catalog_publisher_name
AFTER INSERT OR UPDATE OF display_name ON public.distributor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_catalog_products_from_distributor_profile();

COMMENT ON COLUMN public.products.account_type
IS 'Presentation label in the catalogue: completa or perfil.';
COMMENT ON COLUMN public.products.access_scope
IS 'Availability scope in the catalogue: global or regional.';
COMMENT ON COLUMN public.products.publisher_name
IS 'Public commercial name only; copied from the associated provider/distributor profile.';
