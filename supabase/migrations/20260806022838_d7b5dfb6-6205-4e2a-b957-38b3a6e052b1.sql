
-- Allow public read access to product-images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public Access to product-images') THEN
        CREATE POLICY "Public Access to product-images" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'product-images');
    END IF;
END $$;

-- Allow authenticated admins to upload (INSERT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin Upload product-images') THEN
        CREATE POLICY "Admin Upload product-images" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Allow authenticated admins to update
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin Update product-images') THEN
        CREATE POLICY "Admin Update product-images" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;

-- Allow authenticated admins to delete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admin Delete product-images') THEN
        CREATE POLICY "Admin Delete product-images" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
