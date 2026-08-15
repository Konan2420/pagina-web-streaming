-- Add 'editor' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

-- Allow 'editor' to select from user_roles (required for checks)
-- This is already granted to authenticated, but let's be explicit if needed.
-- Actually has_role is security definer, so it's fine.

-- Let's update the has_role check logic if we want to support hierarchical roles?
-- No, let's keep it simple: just check for the specific role or admin.

-- Example: Allow editors to see stock and sales
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cuentas_stock TO authenticated;
GRANT SELECT ON public.ventas TO authenticated;
GRANT SELECT ON public.servicios_streaming TO authenticated;

-- Ensure RLS policies use has_role correctly for editors too.
-- Most current policies might only check for 'admin'.

-- Let's check existing policies if possible.
