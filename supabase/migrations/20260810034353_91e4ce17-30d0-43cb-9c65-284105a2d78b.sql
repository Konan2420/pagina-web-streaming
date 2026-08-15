-- Corregir permisos de acceso a supplier_profiles para que el admin pueda verlos siempre
-- RLS en supplier_profiles
DROP POLICY IF EXISTS "Public supplier profiles are viewable by everyone" ON public.supplier_profiles;
CREATE POLICY "Public supplier profiles are viewable by everyone" 
ON public.supplier_profiles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can manage their own supplier profile" ON public.supplier_profiles;
CREATE POLICY "Users can manage their own supplier profile" 
ON public.supplier_profiles FOR ALL TO authenticated 
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Asegurar que los grants son correctos
GRANT SELECT ON public.supplier_profiles TO authenticated;
GRANT ALL ON public.supplier_profiles TO service_role;

-- Corregir RLS de account_inventory para que el admin vea todo
DROP POLICY IF EXISTS "Providers can manage their own inventory" ON public.account_inventory;
CREATE POLICY "Providers can manage their own inventory" 
ON public.account_inventory FOR ALL TO authenticated 
USING (
    supplier_id = auth.uid() 
    OR public.has_role(auth.uid(), 'admin')
);

-- Asegurar que profiles es accesible para joins en el panel admin
GRANT SELECT ON public.profiles TO authenticated;
