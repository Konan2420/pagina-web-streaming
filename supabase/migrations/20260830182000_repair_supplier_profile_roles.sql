-- Repair historical commercial identities that have a supplier profile but no
-- elevated role. New assignments already go through the admin server action,
-- which writes the role before creating this profile.
--
-- This only affects an existing supplier profile with no commercial role at
-- all; admins and distributors are deliberately left unchanged.
INSERT INTO public.user_roles (user_id, role)
SELECT supplier.user_id, 'proveedor'::public.app_role
FROM public.supplier_profiles AS supplier
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_roles AS role
  WHERE role.user_id = supplier.user_id
    AND role.role IN (
      'admin'::public.app_role,
      'proveedor'::public.app_role,
      'distribuidor'::public.app_role
    )
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMENT ON TABLE public.supplier_profiles
IS 'Commercial provider identity. Historical rows are synchronized to the proveedor role by migration 20260830182000; new assignments are performed by the admin role action.';
