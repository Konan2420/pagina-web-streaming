-- 1. Storage: restrict public read of product-images to images of active products
DROP POLICY IF EXISTS "Public Read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;

CREATE POLICY "Public read active product images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.is_active = true
      AND p.image_url IS NOT NULL
      AND p.image_url LIKE '%' || storage.objects.name
  )
);

-- 2. Lock down SECURITY DEFINER functions to server-side only
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO service_role;

REVOKE ALL ON FUNCTION public.get_stock_counts(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO service_role;

-- has_role must stay callable: RLS policies on public catalog tables depend on it
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

-- trigger-only functions: not callable via API
REVOKE ALL ON FUNCTION public.refresh_product_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;