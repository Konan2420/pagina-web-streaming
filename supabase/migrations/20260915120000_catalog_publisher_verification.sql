-- Dato público de verificación del vendedor para las tarjetas del catálogo.
--
-- Se copia a `products` en lugar de resolverse con un join: la política RLS de
-- `supplier_profiles` solo concede SELECT a usuarios autenticados
-- (20260810034353), así que el catálogo anónimo no puede leerla. Es el mismo
-- motivo por el que `publisher_name` ya vive en `products` (20260830130000).

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS publisher_is_verified boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.publisher_is_verified
IS 'Public trust flag only; copied from the associated provider profile verification.';

-- Relleno inicial: proveedores según su perfil, y el resto sin verificar.
UPDATE public.products AS product
SET publisher_is_verified = COALESCE(supplier.is_verified, false)
FROM public.supplier_profiles AS supplier
WHERE product.supplier_id = supplier.user_id;

-- Los distribuidores no tienen bandera de verificación en este modelo, y los
-- productos de CMD Streaming tampoco son de un tercero: ninguno se marca.
UPDATE public.products AS product
SET publisher_is_verified = false
WHERE product.supplier_id IS NULL
   OR NOT EXISTS (
     SELECT 1
     FROM public.supplier_profiles AS supplier
     WHERE supplier.user_id = product.supplier_id
   );

-- Al reasignar el autor de un producto se resuelven nombre y verificación a la
-- vez, para que nunca queden desincronizados.
CREATE OR REPLACE FUNCTION public.sync_catalog_product_publisher_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  resolved_name text;
  resolved_verified boolean;
BEGIN
  IF NEW.supplier_id IS NULL THEN
    NEW.publisher_name := NULL;
    NEW.publisher_is_verified := false;
    RETURN NEW;
  END IF;

  SELECT display_name, COALESCE(is_verified, false)
  INTO resolved_name, resolved_verified
  FROM public.supplier_profiles
  WHERE user_id = NEW.supplier_id;

  IF resolved_name IS NULL THEN
    SELECT display_name
    INTO resolved_name
    FROM public.distributor_profiles
    WHERE user_id = NEW.supplier_id;
  END IF;

  NEW.publisher_name := NULLIF(BTRIM(resolved_name), '');
  NEW.publisher_is_verified := COALESCE(resolved_verified, false);
  RETURN NEW;
END;
$$;

-- Un cambio de nombre o de verificación en el perfil comercial se propaga a sus
-- productos publicados.
CREATE OR REPLACE FUNCTION public.sync_catalog_products_from_supplier_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET publisher_name = NULLIF(BTRIM(NEW.display_name), ''),
      publisher_is_verified = COALESCE(NEW.is_verified, false)
  WHERE supplier_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supplier_profiles_sync_catalog_publisher_name ON public.supplier_profiles;
CREATE TRIGGER supplier_profiles_sync_catalog_publisher_name
AFTER INSERT OR UPDATE OF display_name, is_verified ON public.supplier_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_catalog_products_from_supplier_profile();

-- Si el autor pasa a ser un distribuidor, la verificación de proveedor deja de
-- aplicar: el modelo no la contempla para ellos.
CREATE OR REPLACE FUNCTION public.sync_catalog_products_from_distributor_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Si coexistieran ambos perfiles, la identidad de proveedor tiene prioridad.
  UPDATE public.products AS product
  SET publisher_name = NULLIF(BTRIM(NEW.display_name), ''),
      publisher_is_verified = false
  WHERE product.supplier_id = NEW.user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.supplier_profiles AS supplier
      WHERE supplier.user_id = NEW.user_id
    );
  RETURN NEW;
END;
$$;
