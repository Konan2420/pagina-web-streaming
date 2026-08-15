-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create INSERT policy for users to create their own profile
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON public.profiles
        FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 3. Ensure columns are nullable or have defaults to avoid INSERT failures
ALTER TABLE public.profiles ALTER COLUMN whatsapp DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN whatsapp SET DEFAULT '';
ALTER TABLE public.profiles ALTER COLUMN nombre_completo SET DEFAULT '';

-- 4. Ensure GRANTs are correct
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
