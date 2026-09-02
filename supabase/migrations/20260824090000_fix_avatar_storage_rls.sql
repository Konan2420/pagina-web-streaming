-- Corrige la validación de ruta del avatar. `storage.foldername` no incluye
-- el nombre del archivo, por lo que la política anterior bloqueaba los uploads.
DROP POLICY IF EXISTS "Users can insert their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can insert their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name = (select auth.uid()::text || '/avatar.jpg')
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name = (select auth.uid()::text || '/avatar.jpg')
)
WITH CHECK (
  bucket_id = 'avatars'
  AND name = (select auth.uid()::text || '/avatar.jpg')
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name = (select auth.uid()::text || '/avatar.jpg')
);
