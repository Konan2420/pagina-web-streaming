-- Asegurar la revocación total para anon y authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, authenticated, anon;

-- Conceder solo al rol de servicio para uso interno y RLS
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO service_role;

-- Los permisos de Postgres son granulares, a veces 'PUBLIC' incluye a todos.
-- Al revocar explícitamente de anon y authenticated, forzamos la restricción.
