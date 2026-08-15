-- Para silenciar el linter de Supabase (que marca como advertencia que usuarios autenticados 
-- puedan ejecutar funciones SECURITY DEFINER), revocamos explícitamente el permiso de ejecución 
-- al rol 'authenticated' en aquellas que el linter detecta.
-- Nota: 'has_role' y otras se usan internamente en RLS, el motor de la DB las llamará 
-- como dueño (postgres/service_role), no necesita el grant explícito de 'authenticated'
-- si solo se usa en políticas USING/WITH CHECK.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) FROM authenticated;

-- Mantenemos service_role para operaciones administrativas y edge functions.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO service_role;
