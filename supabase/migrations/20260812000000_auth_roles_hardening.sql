-- Canonical authentication and authorization baseline for CMD Streaming.
-- Roles are exclusive in the admin UI: user, proveedor or admin.
-- No email is promoted automatically; an existing administrator must assign
-- elevated roles from the administration panel.

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['admin', 'editor', 'moderator', 'user', 'proveedor']
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = role_name
    ) THEN
      EXECUTE format('ALTER TYPE public.app_role ADD VALUE %L', role_name);
    END IF;
  END LOOP;
END $$;

-- A sign-up must never depend on the browser successfully creating its profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, whatsapp)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'nombre_completo', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = COALESCE(EXCLUDED.email, public.profiles.email),
      nombre_completo = COALESCE(NULLIF(public.profiles.nombre_completo, ''), EXCLUDED.nombre_completo),
      whatsapp = COALESCE(NULLIF(public.profiles.whatsapp, ''), EXCLUDED.whatsapp);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Repair accounts created before the trigger was reliable.
INSERT INTO public.profiles (id, email, nombre_completo, whatsapp)
SELECT
  u.id,
  u.email,
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'nombre_completo', ''),
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(COALESCE(u.email, ''), '@', 1),
    ''
  ),
  COALESCE(u.raw_user_meta_data ->> 'whatsapp', '')
FROM auth.users u
ON CONFLICT (id) DO UPDATE
SET email = COALESCE(EXCLUDED.email, public.profiles.email),
    nombre_completo = COALESCE(NULLIF(public.profiles.nombre_completo, ''), EXCLUDED.nombre_completo),
    whatsapp = COALESCE(NULLIF(public.profiles.whatsapp, ''), EXCLUDED.whatsapp);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Keep role checks available to authenticated route guards and RLS policies.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$ SELECT private.has_role(_user_id, _role) $$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_roles', policy_name);
  END LOOP;
END $$;

CREATE POLICY "Users can read their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Profile access: an account controls only its profile; admins can support all users.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', policy_name);
  END LOOP;
END $$;

CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- A supplier account must always have a profile when it is promoted.
INSERT INTO public.supplier_profiles (user_id, display_name, is_verified, rating, total_sales)
SELECT p.id, COALESCE(NULLIF(p.nombre_completo, ''), split_part(COALESCE(p.email, ''), '@', 1), 'Proveedor'), true, 5, 0
FROM public.profiles p
WHERE EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'proveedor'::public.app_role
)
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'supplier_profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.supplier_profiles', policy_name);
  END LOOP;
END $$;

CREATE POLICY "Suppliers can read their own profile"
ON public.supplier_profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read supplier profiles"
ON public.supplier_profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Suppliers can update their own profile"
ON public.supplier_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage supplier profiles"
ON public.supplier_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

GRANT SELECT, UPDATE ON public.supplier_profiles TO authenticated;
GRANT ALL ON public.supplier_profiles TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
