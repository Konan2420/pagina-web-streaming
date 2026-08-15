
-- 1) Remove the public read access that exposed email/password
DROP POLICY IF EXISTS "Allow public read-only access to inventory status" ON public.account_inventory;
REVOKE SELECT ON public.account_inventory FROM anon;

-- Keep admin-only access (existing "Admins can manage account inventory" policy)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_inventory TO authenticated;
GRANT ALL ON public.account_inventory TO service_role;

-- 2) Safe aggregate-only stock counts (no credentials exposed)
CREATE OR REPLACE FUNCTION public.get_stock_counts(_product_ids uuid[])
RETURNS TABLE(product_id uuid, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ai.product_id, COUNT(*)::int AS available
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
    AND ai.product_id = ANY(_product_ids)
  GROUP BY ai.product_id
$$;

REVOKE ALL ON FUNCTION public.get_stock_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO anon, authenticated, service_role;
