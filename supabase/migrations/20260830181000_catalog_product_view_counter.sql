-- Métrica pública y agregada para la PDP. No almacena visitante, IP, sesión ni ningún dato personal.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS total_vistas integer NOT NULL DEFAULT 0
  CHECK (total_vistas >= 0);

CREATE OR REPLACE FUNCTION public.record_catalog_product_view(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_total integer;
BEGIN
  UPDATE public.products
  SET total_vistas = total_vistas + 1
  WHERE id = p_product_id
    AND COALESCE(is_active, true)
  RETURNING total_vistas INTO next_total;

  IF next_total IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  RETURN next_total;
END;
$$;

REVOKE ALL ON FUNCTION public.record_catalog_product_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_catalog_product_view(uuid) TO anon, authenticated, service_role;

COMMENT ON COLUMN public.products.total_vistas
IS 'Aggregated PDP opens. It contains no visitor identity or personal data.';
