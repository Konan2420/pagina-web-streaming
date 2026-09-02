-- Proveedor y distribuidor pueden personalizar exclusivamente su propio escaparate.
-- Estas políticas no conceden acceso al inventario ni a sus credenciales: Mi Tienda
-- únicamente consume el conteo agregado de stock y no expone datos de cuentas.
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
    AND (
      public.has_role(auth.uid(), 'proveedor')
      OR public.has_role(auth.uid(), 'distribuidor')
    )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_storefront(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_storefront(uuid) TO authenticated, service_role;
