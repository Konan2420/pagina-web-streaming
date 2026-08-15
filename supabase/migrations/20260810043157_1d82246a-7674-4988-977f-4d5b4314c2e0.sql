REVOKE ALL ON FUNCTION public.track_supplier_sale() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_supplier_sale() FROM anon;
REVOKE ALL ON FUNCTION public.track_supplier_sale() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_supplier_sale() TO service_role;