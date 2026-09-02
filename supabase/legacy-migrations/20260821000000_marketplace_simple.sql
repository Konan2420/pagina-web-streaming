-- CMD Streaming: marketplace simple con solo administradores y clientes.
-- Conserva pedidos, entregas, inventario central y payouts.

BEGIN;

-- Todas las cuentas no administrativas vuelven al rol base antes de reducir el enum.
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'user'::public.app_role
FROM public.user_roles
WHERE role::text <> 'admin'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
WHERE ur.role::text <> 'admin'
  AND EXISTS (
    SELECT 1 FROM public.user_roles admin_role
    WHERE admin_role.user_id = ur.user_id
      AND admin_role.role::text = 'admin'
  );

DELETE FROM public.user_roles
WHERE role::text IN ('proveedor', 'vendedor', 'editor', 'moderator');

-- Policies calling has_role depend on the old app_role signature. Recreate the
-- policies needed by the two-role marketplace after the enum replacement.
DO $$
DECLARE policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE coalesce(qual, '') ILIKE '%has_role%'
       OR coalesce(with_check, '') ILIKE '%has_role%'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS private.has_role(uuid, public.app_role);

ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE text
  USING role::text;

CREATE TYPE public.app_role_marketplace AS ENUM ('admin', 'user');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role_marketplace
  USING role::public.app_role_marketplace;
DROP TYPE public.app_role;
ALTER TYPE public.app_role_marketplace RENAME TO app_role;
ALTER TABLE public.user_roles
  ALTER COLUMN role SET DEFAULT 'user'::public.app_role;

CREATE SCHEMA IF NOT EXISTS private;

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Remove the provider rating, commission and storefront model.
DROP TRIGGER IF EXISTS on_inventory_assigned ON public.account_inventory;
DROP TRIGGER IF EXISTS supplier_profiles_protect_commission ON public.supplier_profiles;
DROP TRIGGER IF EXISTS supplier_ratings_refresh ON public.supplier_ratings;
DROP TRIGGER IF EXISTS supplier_ratings_set_updated_at ON public.supplier_ratings;
DROP FUNCTION IF EXISTS public.track_supplier_sale();
DROP FUNCTION IF EXISTS public.protect_supplier_commission();
DROP FUNCTION IF EXISTS public.refresh_supplier_rating();
DROP FUNCTION IF EXISTS public.get_public_suppliers(uuid[]);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'supplier_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.supplier_profiles;
  END IF;
END $$;

DROP TABLE IF EXISTS public.supplier_ratings;
DROP TABLE IF EXISTS public.supplier_profiles;

DROP VIEW IF EXISTS public.stock_counts;
DROP TABLE IF EXISTS public.seller_combo_items;
DROP TABLE IF EXISTS public.seller_combos;
DROP TABLE IF EXISTS public.seller_listings;
DROP TABLE IF EXISTS public.seller_profiles;
DROP FUNCTION IF EXISTS public.seller_set_updated_at();

ALTER TABLE public.account_inventory DROP COLUMN IF EXISTS supplier_id;
ALTER TABLE public.account_inventory DROP COLUMN IF EXISTS seller_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS supplier_id;

-- Aggregate stock remains public, while credentials stay readable only by admins
-- or through the delivery record belonging to the customer.
CREATE OR REPLACE VIEW public.stock_counts AS
  SELECT ai.product_id, COUNT(*)::int AS available
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
  GROUP BY ai.product_id;

CREATE OR REPLACE FUNCTION private.get_stock_counts(_product_ids uuid[])
RETURNS TABLE(product_id uuid, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT ai.product_id, COUNT(*)::int
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
    AND ai.product_id = ANY(_product_ids)
  GROUP BY ai.product_id
$$;

CREATE OR REPLACE FUNCTION public.get_stock_counts(_product_ids uuid[])
RETURNS TABLE(product_id uuid, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$ SELECT * FROM private.get_stock_counts(_product_ids) $$;

REVOKE ALL ON FUNCTION private.get_stock_counts(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_stock_counts(uuid[]) TO service_role;
REVOKE ALL ON FUNCTION public.get_stock_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refresh_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE _product_id uuid;
BEGIN
  FOR _product_id IN
    SELECT DISTINCT product_id
    FROM (
      SELECT CASE WHEN TG_OP <> 'DELETE' THEN NEW.product_id END AS product_id
      UNION ALL
      SELECT CASE WHEN TG_OP <> 'INSERT' THEN OLD.product_id END AS product_id
    ) affected
    WHERE product_id IS NOT NULL
  LOOP
    INSERT INTO public.product_stock (product_id, available, updated_at)
    VALUES (
      _product_id,
      (
        SELECT COUNT(*)
        FROM public.account_inventory ai
        WHERE ai.product_id = _product_id
          AND ai.status IN ('available', 'disponible')
      ),
      now()
    )
    ON CONFLICT (product_id)
    DO UPDATE SET available = EXCLUDED.available, updated_at = now();
  END LOOP;
  RETURN NULL;
END;
$$;

INSERT INTO public.product_stock (product_id, available, updated_at)
SELECT ai.product_id, COUNT(*)::int, now()
FROM public.account_inventory ai
WHERE ai.status IN ('available', 'disponible')
GROUP BY ai.product_id
ON CONFLICT (product_id)
DO UPDATE SET available = EXCLUDED.available, updated_at = now();

-- Price history is immutable to the client and written only by the product trigger.
CREATE TABLE IF NOT EXISTS public.product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  previous_price numeric(12,2),
  new_price numeric(12,2) NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_price_history_product_created_idx
  ON public.product_price_history(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_product_price_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.product_price_history (product_id, previous_price, new_price, changed_by)
    VALUES (NEW.id, NULL, NEW.price, auth.uid());
  ELSIF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.product_price_history (product_id, previous_price, new_price, changed_by)
    VALUES (NEW.id, OLD.price, NEW.price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_record_price_change ON public.products;
CREATE TRIGGER products_record_price_change
  AFTER INSERT OR UPDATE OF price ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.record_product_price_change();

ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- Atomic immediate delivery: one available account is locked, assigned and
-- copied to the user's delivery record in the same transaction.
CREATE OR REPLACE FUNCTION public.place_order_with_inventory(_product_id uuid)
RETURNS TABLE(order_id uuid, product_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _account_id uuid;
  _order_id uuid;
  _product_name text;
  _price numeric;
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT p.name, p.price
  INTO _product_name, _price
  FROM public.products p
  WHERE p.id = _product_id AND COALESCE(p.is_active, true);

  IF _product_name IS NULL THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  SELECT ai.id
  INTO _account_id
  FROM public.account_inventory ai
  WHERE ai.product_id = _product_id
    AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF _account_id IS NULL THEN
    RAISE EXCEPTION 'No stock available';
  END IF;

  INSERT INTO public.orders (user_id, producto_id, producto_nombre, precio, estado, payment_verified)
  VALUES (_user_id, _product_id::text, _product_name, _price, 'entregado', true)
  RETURNING id INTO _order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = _order_id, assigned_at = now(), payment_verified = true
  WHERE id = _account_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, _user_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = _account_id;

  RETURN QUERY SELECT _order_id, _product_name, _price;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order_with_inventory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order_with_inventory(uuid) TO authenticated, service_role;

-- Cart checkout uses this wrapper so a missing account rolls back the whole
-- cart instead of producing a partial delivery.
CREATE OR REPLACE FUNCTION public.place_orders_with_inventory(_product_ids uuid[])
RETURNS TABLE(order_id uuid, product_name text, price numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE _product_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF coalesce(array_length(_product_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  FOREACH _product_id IN ARRAY _product_ids
  LOOP
    RETURN QUERY SELECT * FROM public.place_order_with_inventory(_product_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.place_orders_with_inventory(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_orders_with_inventory(uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _account_id uuid;
  _user_id uuid;
  _paid boolean;
  _caller uuid := auth.uid();
  _is_admin boolean;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  _is_admin := public.has_role(_caller, 'admin');

  SELECT user_id, COALESCE(payment_verified, false)
  INTO _user_id, _paid
  FROM public.orders
  WHERE id = _order_id;

  IF _user_id IS NULL THEN RETURN FALSE; END IF;
  IF _user_id <> _caller AND NOT _is_admin THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT _paid AND NOT _is_admin THEN RETURN FALSE; END IF;

  SELECT id INTO _account_id
  FROM public.account_inventory
  WHERE product_id = _product_id AND status IN ('available', 'disponible')
  ORDER BY created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
  IF _account_id IS NULL THEN RETURN FALSE; END IF;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = _order_id, assigned_at = now()
  WHERE id = _account_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT _order_id, _user_id, email, password, access_link, notes
  FROM public.account_inventory WHERE id = _account_id;

  UPDATE public.orders SET estado = 'entregado', updated_at = now() WHERE id = _order_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;

-- Two-role RLS baseline for the marketplace tables.
DO $$
DECLARE table_name text;
DECLARE policy_record record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'user_roles', 'profiles', 'products', 'product_stock', 'account_inventory',
    'orders', 'delivered_accounts', 'product_price_history', 'manual_orders',
    'payouts', 'admin_status'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      FOR policy_record IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own role"
ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT USING (COALESCE(is_active, true) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view stock counts"
ON public.product_stock FOR SELECT USING (true);
CREATE POLICY "Admins can manage stock counts"
ON public.product_stock FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.account_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage account inventory"
ON public.account_inventory FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.delivered_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own delivered accounts"
ON public.delivered_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all delivered accounts"
ON public.delivered_accounts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view price history"
ON public.product_price_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.manual_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own manual orders"
ON public.manual_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage manual orders"
ON public.manual_orders FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payouts"
ON public.payouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read availability status"
ON public.admin_status FOR SELECT USING (true);
CREATE POLICY "Admins can manage availability status"
ON public.admin_status FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- These tables remain part of the active admin dashboard, so their two-role
-- policies are restored after replacing the enum signature used by has_role.
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read all analytics events"
ON public.analytics_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.cuentas_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage legacy stock"
ON public.cuentas_stock FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own legacy sales"
ON public.ventas FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all legacy sales"
ON public.ventas FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- The role function is used by these Storage policies as well; they are
-- recreated because their previous definitions were intentionally removed
-- before replacing the app_role enum.
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.products, public.product_stock TO anon, authenticated;
GRANT SELECT ON public.user_roles, public.profiles, public.orders, public.delivered_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_inventory TO authenticated;
GRANT SELECT ON public.product_price_history TO authenticated;
GRANT ALL ON public.product_price_history TO service_role;

COMMIT;
