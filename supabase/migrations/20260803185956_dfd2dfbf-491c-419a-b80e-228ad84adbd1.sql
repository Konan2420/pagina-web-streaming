-- Restringir ejecución de la función asignar_cuenta_streaming
-- Por defecto, Postgres permite que 'public' ejecute funciones.
-- Revocamos el acceso a todos y solo lo permitimos a 'service_role'.
-- La lógica de venta debería dispararse desde un servidor (Server Function)
-- para mayor seguridad, usando la service_role key o un rol específico.

REVOKE EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO service_role;
