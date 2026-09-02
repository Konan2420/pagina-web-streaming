-- La gestión de catálogo, stock y credenciales pertenece exclusivamente al proveedor.
-- Las políticas existentes de storefront invocan esta función, por lo que el cambio
-- aplica a configuración, personalizaciones, combos y sus ítems relacionados.
CREATE OR REPLACE FUNCTION public.can_manage_storefront(_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    public.has_role(auth.uid(), 'admin')
    AND public.has_role(_owner_id, 'proveedor')
  )
  OR (
    auth.uid() = _owner_id
    AND public.has_role(auth.uid(), 'proveedor')
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_storefront(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_storefront(uuid) TO authenticated, service_role;
