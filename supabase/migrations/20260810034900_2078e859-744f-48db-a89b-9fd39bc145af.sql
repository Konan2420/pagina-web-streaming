-- 1. Eliminar FK si existe (por si acaso hay restos)
ALTER TABLE public.supplier_profiles DROP CONSTRAINT IF EXISTS supplier_profiles_user_id_fkey;

-- 2. Asegurar que la columna existe (ya existe, pero reforzamos tipo)
ALTER TABLE public.supplier_profiles ALTER COLUMN user_id SET NOT NULL;

-- 3. Crear la Foreign Key explícita hacia public.profiles
-- Usamos public.profiles porque el join en el código busca esa relación
ALTER TABLE public.supplier_profiles 
ADD CONSTRAINT supplier_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Garantizar permisos en la tabla de perfiles para que el join funcione
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;

-- 5. Reforzar RLS para administradores
DROP POLICY IF EXISTS "Admins can view all supplier profiles" ON public.supplier_profiles;
CREATE POLICY "Admins can view all supplier profiles" 
ON public.supplier_profiles 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Reforzar RLS para el propio proveedor
DROP POLICY IF EXISTS "Suppliers can view their own profile" ON public.supplier_profiles;
CREATE POLICY "Suppliers can view their own profile" 
ON public.supplier_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
