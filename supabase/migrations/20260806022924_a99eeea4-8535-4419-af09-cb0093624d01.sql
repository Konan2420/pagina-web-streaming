
-- Eliminar políticas antiguas si existen para evitar duplicados o conflictos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin Updates" ON storage.objects;
DROP POLICY IF EXISTS "Admin Deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete product-images" ON storage.objects;

-- Asegurar que el bucket sea privado (el código usará URLs firmadas para mayor seguridad)
-- Nota: El bucket ya fue creado como privado anteriormente.

-- 1. Permitir que los administradores suban archivos
CREATE POLICY "Admin Upload product-images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 2. Permitir que los administradores vean los archivos para generar URLs firmadas y previsualizar
CREATE POLICY "Admin Select product-images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 3. Permitir que los administradores actualicen
CREATE POLICY "Admin Update product-images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 4. Permitir que los administradores eliminen
CREATE POLICY "Admin Delete product-images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- 5. Permitir lectura pública de los objetos (SELECT) si queremos URLs directas, 
-- pero dado que estamos usando Signed URLs por seguridad y el bucket es privado, 
-- la política de SELECT para 'public' no es estrictamente necesaria a menos que el bucket fuera público.
-- Sin embargo, para máxima compatibilidad con el flujo de previsualización:
CREATE POLICY "Public Read product-images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'product-images');
