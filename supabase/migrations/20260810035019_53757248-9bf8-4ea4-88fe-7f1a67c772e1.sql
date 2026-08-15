-- Revocar acceso público a asignar_cuenta_streaming
REVOKE ALL ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO service_role;

-- Revocar acceso público a get_stock_counts
REVOKE ALL ON FUNCTION public.get_stock_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO authenticated, service_role;

-- Revocar acceso público a handle_new_user (trigger function)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Revocar acceso público a refresh_product_stock
REVOKE ALL ON FUNCTION public.refresh_product_stock() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.refresh_product_stock() TO service_role;
