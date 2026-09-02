-- Canonical authorization model for CMD Streaming.
-- Historical supplier data is retained. The supported roles are admin, proveedor
-- and user; only administrators can read or modify account credentials directly.

DELETE FROM public.user_roles
WHERE role::text NOT IN ('admin', 'proveedor', 'user');

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_allowed_values;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_allowed_values
  CHECK (role::text IN ('admin', 'proveedor', 'user')) NOT VALID;

ALTER TABLE public.user_roles
  VALIDATE CONSTRAINT user_roles_allowed_values;

-- Retire supplier-specific RLS paths that granted credential access. Keep the
-- supplier_id column and supplier profiles intact for historical records.
DROP POLICY IF EXISTS "Providers can manage their own inventory" ON public.account_inventory;
DROP POLICY IF EXISTS "Admins can manage account inventory" ON public.account_inventory;
DROP POLICY IF EXISTS "Providers can see their assigned products" ON public.products;

CREATE POLICY "Admins can manage account inventory"
ON public.account_inventory
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.account_inventory FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_inventory TO authenticated;
GRANT ALL ON public.account_inventory TO service_role;

COMMENT ON CONSTRAINT user_roles_allowed_values ON public.user_roles
IS 'CMD Streaming permits admin, proveedor and user roles; legacy enum labels are not assignable.';
