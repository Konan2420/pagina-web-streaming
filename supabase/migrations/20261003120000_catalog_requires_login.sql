-- The catalog and festive offers require a signed-in Supabase user.
-- Browser route guards alone cannot protect PostgREST or RPC calls.

REVOKE SELECT ON public.products FROM anon;
REVOKE SELECT ON public.servicios_streaming FROM anon;
REVOKE SELECT ON public.product_stock FROM anon;
REVOKE SELECT ON public.stock_counts FROM anon;
REVOKE SELECT ON public.festive_events FROM anon;
REVOKE SELECT ON public.festive_event_products FROM anon;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Products are visible to everyone" ON public.products;
DROP POLICY IF EXISTS "Public can read active catalog products" ON public.products;
DROP POLICY IF EXISTS "Public can read active approved catalog products" ON public.products;
DROP POLICY IF EXISTS "Signed-in users can read active approved catalog products" ON public.products;

CREATE POLICY "Signed-in users can read active approved catalog products"
ON public.products FOR SELECT TO authenticated
USING (COALESCE(is_active, true) AND approval_status = 'approved');

REVOKE EXECUTE ON FUNCTION public.get_public_suppliers(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_catalog_product_activity(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_catalog_product_view(uuid) FROM anon;

-- The active-event policies may stay in place for authenticated users.
-- Remove anonymous table privileges so PostgREST cannot return their rows.
COMMENT ON POLICY "Signed-in users can read active approved catalog products" ON public.products
IS 'Catalog visibility requires a valid Supabase authenticated role; admin and owner policies remain separate.';
