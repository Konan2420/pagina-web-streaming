-- Otorgar permisos de escritura a authenticated y service_role en user_roles
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Crear política para que los administradores gestionen los roles
-- Usamos public.has_role(auth.uid(), 'admin') que es SECURITY DEFINER
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'Admins can manage user roles'
    ) THEN
        CREATE POLICY "Admins can manage user roles"
        ON public.user_roles
        FOR ALL
        TO authenticated
        USING (public.has_role(auth.uid(), 'admin'))
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
    END IF;
END $$;
