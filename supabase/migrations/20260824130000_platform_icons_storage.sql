-- Logos públicos usados por la navegación de plataformas administrada desde CMD ADMIN.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-icons',
  'platform-icons',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read platform icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert platform icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update platform icons" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete platform icons" ON storage.objects;

CREATE POLICY "Public can read platform icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'platform-icons');

CREATE POLICY "Admins can insert platform icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'platform-icons'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update platform icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'platform-icons'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'platform-icons'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete platform icons"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'platform-icons'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
