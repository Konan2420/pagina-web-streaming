
-- Enable RLS and grant access for account_inventory stock counts
ALTER TABLE public.account_inventory ENABLE ROW LEVEL SECURITY;

-- If policy exists, we replace it or just ensure it exists
DROP POLICY IF EXISTS "Allow public read-only access to inventory status" ON public.account_inventory;
CREATE POLICY "Allow public read-only access to inventory status"
ON public.account_inventory
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.account_inventory TO anon, authenticated;
GRANT ALL ON public.account_inventory TO service_role;
