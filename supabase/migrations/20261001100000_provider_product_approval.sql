-- Flujo idempotente de revisión de productos enviados por proveedores.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.products
SET approval_status = 'pending'
WHERE supplier_id IS NOT NULL
  AND COALESCE(is_active, false) = false
  AND approval_status = 'approved';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_approval_status_check,
  ADD CONSTRAINT products_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));

DROP POLICY IF EXISTS "Public can read active catalog products" ON public.products;
CREATE POLICY "Public can read active approved catalog products"
ON public.products
FOR SELECT TO anon, authenticated
USING (COALESCE(is_active, true) AND approval_status = 'approved');

-- Los proveedores nunca pueden marcarse verificados desde su propio perfil.
-- El trigger existente también protege comisión y métricas; aquí se conserva ese
-- contrato y se añade is_verified a la lista de campos administrados.
CREATE OR REPLACE FUNCTION public.protect_supplier_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trusted boolean := auth.uid() IS NULL
    OR current_setting('app.rating_refresh', true) = 'on'
    OR public.has_role(auth.uid(), 'admin');
BEGIN
  IF NOT trusted THEN
    NEW.commission_rate := OLD.commission_rate;
    NEW.rating := OLD.rating;
    NEW.total_reviews := OLD.total_reviews;
    NEW.is_verified := OLD.is_verified;
  END IF;
  RETURN NEW;
END;
$$;

CREATE INDEX IF NOT EXISTS products_approval_status_idx
  ON public.products (approval_status);

COMMENT ON COLUMN public.products.approval_status IS
  'Revisión del producto: pending, approved o rejected.';
COMMENT ON COLUMN public.products.rejection_reason IS
  'Motivo visible al proveedor cuando el administrador rechaza el producto.';
