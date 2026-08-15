-- 1. Eliminar políticas duplicadas o conflictivas en profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins/Editors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- 2. Crear política limpia y única de SELECT
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (
  (auth.uid() = id) OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'editor')
);

-- 3. Asegurar que el email sea único para permitir ON CONFLICT (email) en el futuro
-- Aunque por ahora usaremos ON CONFLICT (id) que es la PK confirmada.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 4. Asegurar integridad del admin musacamd
DO $$
DECLARE
    auth_id uuid;
BEGIN
    SELECT id INTO auth_id FROM auth.users WHERE email = 'musacamd@gmail.com';
    IF auth_id IS NOT NULL THEN
        -- Usamos la PK 'id' para el conflicto ya que es lo que tenemos seguro
        INSERT INTO public.profiles (id, email)
        VALUES (auth_id, 'musacamd@gmail.com')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
        
        -- Asegurar rol admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (auth_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
