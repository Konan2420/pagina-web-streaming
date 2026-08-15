-- Restringir ejecución de funciones sensibles
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;

-- Asegurar que track_supplier_sale no sea ejecutable por anon
REVOKE ALL ON FUNCTION public.track_supplier_sale() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_supplier_sale() TO service_role;
