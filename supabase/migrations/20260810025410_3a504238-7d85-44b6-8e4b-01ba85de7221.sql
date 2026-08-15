-- 1. Corregir search_path y restringir ejecución de track_supplier_sale
ALTER FUNCTION public.track_supplier_sale() SET search_path = public;
REVOKE ALL ON FUNCTION public.track_supplier_sale() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_supplier_sale() TO service_role;
