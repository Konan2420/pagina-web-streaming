-- Las políticas de acceso (p. ej. products) evalúan has_role también para visitantes anónimos.
-- Sin EXECUTE, PostgREST rechaza la consulta pública del catálogo.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
