-- 1. Restringir has_role
-- Revocar ejecución pública
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
-- Solo service_role puede ejecutarla (se usa en políticas RLS como owner)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
-- Nota: has_role se usa en RLS. Si el owner de la RLS es service_role o postgres, funcionará.

-- 2. Restringir assign_inventory_to_order
REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO service_role;

-- 3. Restringir track_supplier_sale
REVOKE EXECUTE ON FUNCTION public.track_supplier_sale() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.track_supplier_sale() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_supplier_sale() TO service_role;

-- Asegurar que las políticas RLS que usan has_role funcionen.
-- La función has_role es SECURITY DEFINER, lo que significa que corre con los permisos del creador (usualmente postgres/service_role).
-- Al quitar el permiso de EXECUTE a 'authenticated', evitamos llamadas directas via RPC, 
-- pero la base de datos aún puede usarla internamente para evaluar RLS.
