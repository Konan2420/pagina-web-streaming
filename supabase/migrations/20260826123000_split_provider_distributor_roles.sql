-- Separate commercial distributors from content providers.
-- Providers own products and credential inventory. Distributors are allowed to
-- access their own commercial workspace and the public catalogue only.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'app_role'
      AND e.enumlabel = 'distribuidor'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'distribuidor';
  END IF;
END $$;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_allowed_values;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_allowed_values
  CHECK (role::text IN ('admin', 'proveedor', 'distribuidor', 'user')) NOT VALID;

ALTER TABLE public.user_roles
  VALIDATE CONSTRAINT user_roles_allowed_values;

CREATE TABLE IF NOT EXISTS public.distributor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS distributor_profiles_user_id_idx
  ON public.distributor_profiles (user_id);

ALTER TABLE public.distributor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Distributors can read their own profile" ON public.distributor_profiles;
DROP POLICY IF EXISTS "Distributors can update their own profile" ON public.distributor_profiles;
DROP POLICY IF EXISTS "Admins can read distributor profiles" ON public.distributor_profiles;
DROP POLICY IF EXISTS "Admins can manage distributor profiles" ON public.distributor_profiles;

CREATE POLICY "Distributors can read their own profile"
ON public.distributor_profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Distributors can update their own profile"
ON public.distributor_profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage distributor profiles"
ON public.distributor_profiles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.distributor_profiles FROM anon;
GRANT SELECT, UPDATE ON public.distributor_profiles TO authenticated;
GRANT ALL ON public.distributor_profiles TO service_role;

COMMENT ON TABLE public.distributor_profiles
IS 'Commercial distributor identity. It is intentionally separate from supplier_profiles.';

COMMENT ON CONSTRAINT user_roles_allowed_values ON public.user_roles
IS 'CMD Streaming permits admin, proveedor, distribuidor and user roles. A user may have only one elevated role through the admin UI.';
