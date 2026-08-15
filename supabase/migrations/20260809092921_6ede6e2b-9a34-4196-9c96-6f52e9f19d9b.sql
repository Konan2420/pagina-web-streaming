-- Revocar ejecución pública de TODAS las funciones SECURITY DEFINER en el esquema public
-- y permitir ejecución solo a los roles necesarios (service_role por defecto, y authenticated para las de lógica de negocio).

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.refresh_product_stock() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_product_stock() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO authenticated, service_role;
