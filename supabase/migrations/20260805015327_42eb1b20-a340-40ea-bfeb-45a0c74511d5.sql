-- 1. Ensure 'email' column exists in profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE public.profiles ADD COLUMN email text;
  END IF;
END $$;

-- 2. Backfill profile for musacamd@gmail.com if missing
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'musacamd@gmail.com' LIMIT 1;
    IF v_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
            INSERT INTO public.profiles (id, email, nombre_completo)
            VALUES (v_user_id, 'musacamd@gmail.com', 'Carlos Durand');
        END IF;
        -- Ensure admin role
        IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin') THEN
            INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin')
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END IF;
END $$;

-- 3. Correct RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
CREATE POLICY "Users can select their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Storage policies for product-images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin Uploads" ON storage.objects;
CREATE POLICY "Admin Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Updates" ON storage.objects;
CREATE POLICY "Admin Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin Deletes" ON storage.objects;
CREATE POLICY "Admin Deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
