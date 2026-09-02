-- Permite navegar únicamente los productos activos desde la tienda pública.
-- No concede permisos de escritura ni acceso a inventario, pedidos o credenciales.
BEGIN;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- Las políticas de productos pueden evaluar has_role() incluso para una
-- petición anónima. El wrapper público debe ejecutar con los privilegios de
-- su propietario para consultar la implementación privada sin exponerla.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$ SELECT private.has_role(_user_id, _role) $$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
TO anon, authenticated, service_role;

-- Las políticas antiguas sin `TO authenticated` podían evaluar has_role()
-- para visitantes anónimos e impedir el acceso antes de llegar a la política
-- pública del catálogo.
DROP POLICY IF EXISTS "Public can read active catalog products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Providers can see their assigned products" ON public.products;

CREATE POLICY "Public can read active catalog products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (COALESCE(is_active, true));

-- Estas políticas evitan invocar has_role() durante la lectura pública.
-- Un usuario autenticado solo comprueba su propio registro de rol, que ya
-- está permitido por la política de user_roles.
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
);

CREATE POLICY "Providers can see their assigned products"
ON public.products
FOR SELECT
TO authenticated
USING (
  supplier_id = auth.uid()
  OR COALESCE(is_active, true)
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::public.app_role
  )
);

COMMIT;
