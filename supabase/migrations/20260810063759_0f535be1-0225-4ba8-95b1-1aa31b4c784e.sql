CREATE OR REPLACE FUNCTION public.get_public_suppliers(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, avatar_effect text, is_verified boolean, rating numeric, total_reviews integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT sp.user_id, sp.display_name, sp.avatar_url, sp.avatar_effect,
         COALESCE(sp.is_verified, false), COALESCE(sp.rating, 0), COALESCE(sp.total_reviews, 0)
  FROM public.supplier_profiles sp
  WHERE sp.user_id = ANY(_user_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_suppliers(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_suppliers(uuid[]) TO anon, authenticated, service_role;