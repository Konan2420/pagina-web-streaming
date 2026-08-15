ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE INSERT ON public.analytics_events FROM anon;
REVOKE INSERT ON public.analytics_events FROM authenticated;

GRANT USAGE ON TYPE public.app_role TO authenticated;
GRANT USAGE ON TYPE public.app_role TO anon;