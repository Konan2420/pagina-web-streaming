-- 1. Fix Profiles Table column constraints and add missing columns
ALTER TABLE public.profiles ALTER COLUMN nombre_completo DROP NOT NULL;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- 2. Grant access to profiles (Re-apply)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins/Editors can view all profiles" ON public.profiles;
CREATE POLICY "Admins/Editors can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'editor')
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 5. Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill existing users
INSERT INTO public.profiles (id, email, nombre_completo)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  nombre_completo = COALESCE(profiles.nombre_completo, EXCLUDED.nombre_completo);

-- 7. Ensure musacamd@gmail.com is admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'musacamd@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
