-- Asegurar que las funciones SECURITY DEFINER críticas no sean ejecutables por usuarios anónimos
-- (La advertencia del linter es sobre usuarios autenticados, pero para CMD Streaming 
-- necesitamos que los admins -que son autenticados- puedan usarlas a través de las políticas RLS).
-- Sin embargo, revocamos el acceso público general por seguridad.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Si existen otras funciones SECURITY DEFINER reportadas (como asignar stock), asegurar sus permisos:
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assign_inventory_to_order') THEN
        REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;
    END IF;
END $$;
