-- Provider access for CMD Streaming.
-- `proveedor` owns products and inventory. The separate `distribuidor` role is
-- introduced in the following migration. Product and inventory mutations remain
-- behind server functions, so credentials are never exposed through browser RLS.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = 'proveedor'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'proveedor';
  END IF;
END $$;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_allowed_values;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_allowed_values
  CHECK (role::text IN ('admin', 'proveedor', 'user')) NOT VALID;

ALTER TABLE public.user_roles
  VALIDATE CONSTRAINT user_roles_allowed_values;

CREATE TABLE IF NOT EXISTS public.supplier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  is_verified boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  commission_rate numeric(5,2) NOT NULL DEFAULT 70,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_profiles
  ADD COLUMN IF NOT EXISTS total_reviews integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.account_inventory
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_supplier_id_idx
  ON public.products (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS account_inventory_supplier_id_idx
  ON public.account_inventory (supplier_id, status, created_at DESC);

-- Direct browser access to account credentials stays administrator-only (defined
-- by the preceding hardening migration). Provider actions use server functions
-- that validate both the role and `supplier_id` ownership before each mutation.
COMMENT ON COLUMN public.products.supplier_id
  IS 'Provider that owns this draft or published product.';
COMMENT ON COLUMN public.account_inventory.supplier_id
  IS 'Provider that supplied this credential record.';
