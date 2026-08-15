-- analytics_events: inserts are allowed for anon/authenticated by policy (WITH CHECK true),
-- reads are admin-only by policy. Grants must match those policies exactly.
REVOKE ALL ON public.analytics_events FROM anon, authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

-- user_roles: never reachable by anon. Authenticated access is fully constrained by RLS:
-- self/admin read, admin-only writes.
REVOKE ALL ON public.user_roles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Belt and braces: make sure RLS is on for both.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;