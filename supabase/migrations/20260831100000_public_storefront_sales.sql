-- Escaparates públicos: identidad visual, orden, venta atómica y utilidad de plataforma.
-- Los importes se calculan aquí; el navegador nunca puede elegir el costo ni el destinatario.

ALTER TABLE public.storefront_settings
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS availability_mode text NOT NULL DEFAULT 'manual'
    CHECK (availability_mode IN ('manual', 'schedule')),
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS opens_at time,
  ADD COLUMN IF NOT EXISTS closes_at time,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Lima';

ALTER TABLE public.store_product_overrides
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.store_combos
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS store_product_overrides_owner_order_idx
  ON public.store_product_overrides (store_owner_id, display_order, updated_at DESC);
CREATE INDEX IF NOT EXISTS store_combos_owner_order_idx
  ON public.store_combos (store_owner_id, display_order, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.storefront_category_orders (
  store_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_key text NOT NULL CHECK (char_length(btrim(category_key)) BETWEEN 2 AND 80),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_owner_id, category_key)
);

CREATE INDEX IF NOT EXISTS storefront_category_orders_owner_order_idx
  ON public.storefront_category_orders (store_owner_id, display_order, category_key);

DROP TRIGGER IF EXISTS storefront_category_orders_set_updated_at ON public.storefront_category_orders;
CREATE TRIGGER storefront_category_orders_set_updated_at
BEFORE UPDATE ON public.storefront_category_orders
FOR EACH ROW EXECUTE FUNCTION public.set_storefront_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS storefront_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS store_product_override_id uuid REFERENCES public.store_product_overrides(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_storefront_owner_created_idx
  ON public.orders (storefront_owner_id, created_at DESC)
  WHERE storefront_owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_storefront_override_created_idx
  ON public.orders (store_product_override_id, created_at DESC)
  WHERE store_product_override_id IS NOT NULL;

ALTER TABLE public.owner_notifications
  ALTER COLUMN product_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS catalog_order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.owner_notifications
  DROP CONSTRAINT IF EXISTS owner_notifications_notification_type_check;
ALTER TABLE public.owner_notifications
  ADD CONSTRAINT owner_notifications_notification_type_check
  CHECK (notification_type IN ('stock_out', 'storefront_sale'));

CREATE INDEX IF NOT EXISTS owner_notifications_catalog_order_idx
  ON public.owner_notifications (catalog_order_id)
  WHERE catalog_order_id IS NOT NULL;

-- Un único destinatario financiero evita duplicar utilidad cuando existen varios admins.
ALTER TABLE public.admin_notification_settings
  ADD COLUMN IF NOT EXISTS sales_wallet_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.admin_notification_settings AS settings
SET sales_wallet_user_id = (
  SELECT role_row.user_id
  FROM public.user_roles AS role_row
  WHERE role_row.role = 'admin'::public.app_role
  ORDER BY role_row.user_id
  LIMIT 1
)
WHERE settings.id = 'default'
  AND settings.sales_wallet_user_id IS NULL;

-- Se corrige la restricción original, que solo contemplaba movimientos SMM y
-- impedía registrar los movimientos de catálogo que ya existen en la aplicación.
ALTER TABLE public.wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;
ALTER TABLE public.wallet_transactions
  ADD CONSTRAINT wallet_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'social_service_cost',
    'social_service_refund',
    'catalog_order_cost',
    'storefront_purchase',
    'storefront_sale_profit'
  ));

-- Admin supervisa cualquier escaparate comercial; proveedor y distribuidor solo el propio.
CREATE OR REPLACE FUNCTION public.can_manage_storefront(_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    AND (
      auth.uid() = _owner_id
      OR public.has_role(_owner_id, 'proveedor'::public.app_role)
      OR public.has_role(_owner_id, 'distribuidor'::public.app_role)
    )
  )
  OR (
    auth.uid() = _owner_id
    AND (
      public.has_role(auth.uid(), 'proveedor'::public.app_role)
      OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
    )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_storefront(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_storefront(uuid) TO authenticated, service_role;

ALTER TABLE public.storefront_category_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.storefront_category_orders FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_category_orders TO authenticated;
GRANT ALL ON public.storefront_category_orders TO service_role;

DROP POLICY IF EXISTS "Store owners and admins manage category order" ON public.storefront_category_orders;
CREATE POLICY "Store owners and admins manage category order"
ON public.storefront_category_orders FOR ALL TO authenticated
USING (public.can_manage_storefront(store_owner_id))
WITH CHECK (public.can_manage_storefront(store_owner_id));

-- Imágenes públicas de la tienda. Las reglas de tipo y tamaño se aplican en el
-- bucket y las rutas se aíslan por UUID del dueño: <owner-id>/cover.webp.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'storefront-media',
  'storefront-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read storefront media" ON storage.objects;
CREATE POLICY "Public can read storefront media"
ON storage.objects FOR SELECT
USING (bucket_id = 'storefront-media');

DROP POLICY IF EXISTS "Commercial users manage storefront media" ON storage.objects;
CREATE POLICY "Commercial users manage storefront media"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'storefront-media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.can_manage_storefront(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'storefront-media'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.can_manage_storefront(((storage.foldername(name))[1])::uuid)
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);

CREATE OR REPLACE FUNCTION public.place_storefront_catalog_order_from_wallet(
  p_store_slug text,
  p_store_product_override_id uuid,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  order_id uuid,
  charged_pen numeric,
  profit_credited_pen numeric,
  expires_on date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  resolved_store_owner_id uuid;
  profit_recipient_id uuid;
  listing public.store_product_overrides%ROWTYPE;
  product_row public.products%ROWTYPE;
  inventory_id uuid;
  created_order_id uuid;
  wholesale_cost numeric(16, 6);
  public_price numeric(16, 2);
  profit_amount numeric(16, 2);
  buyer_balance numeric(16, 6);
  admin_balance numeric(16, 6);
  buyer_final_balance numeric(16, 6);
  admin_final_balance numeric(16, 6);
  expiration_date date;
  enabled_auto_renew boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to place a storefront order';
  END IF;

  SELECT settings.store_owner_id
  INTO resolved_store_owner_id
  FROM public.storefront_settings
  WHERE store_slug = lower(btrim(p_store_slug))
    AND is_public = true
  FOR SHARE;
  IF resolved_store_owner_id IS NULL THEN
    RAISE EXCEPTION 'Storefront is not available';
  END IF;

  SELECT *
  INTO listing
  FROM public.store_product_overrides AS override_row
  WHERE override_row.id = p_store_product_override_id
    AND override_row.store_owner_id = resolved_store_owner_id
    AND source_type = 'master_catalog'
    AND is_visible = true
    AND sale_price_pen IS NOT NULL
  FOR SHARE;
  IF listing.id IS NULL THEN
    RAISE EXCEPTION 'Storefront product is not available';
  END IF;

  SELECT *
  INTO product_row
  FROM public.products
  WHERE id = listing.master_product_id
    AND COALESCE(is_active, true)
    AND COALESCE(is_catalog_available, true)
  FOR SHARE;
  IF product_row.id IS NULL THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  public_price := round(COALESCE(listing.promo_price_pen, listing.sale_price_pen), 2);
  SELECT COALESCE(cost.unit_cost_pen, product_row.price)
  INTO wholesale_cost
  FROM public.catalog_product_costs AS cost
  WHERE cost.product_id = product_row.id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);
  IF public_price < wholesale_cost THEN
    RAISE EXCEPTION 'The storefront price cannot be lower than the product cost';
  END IF;
  profit_amount := round(GREATEST(public_price - wholesale_cost, 0), 2);

  SELECT sales_wallet_user_id
  INTO profit_recipient_id
  FROM public.admin_notification_settings
  WHERE id = 'default';
  IF profit_recipient_id IS NULL
    OR NOT public.has_role(profit_recipient_id, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'The platform sales wallet is not configured';
  END IF;

  SELECT ai.id
  INTO inventory_id
  FROM public.account_inventory AS ai
  WHERE ai.product_id = product_row.id
    AND ai.status IN ('available', 'disponible')
  ORDER BY ai.created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;
  IF inventory_id IS NULL THEN
    RAISE EXCEPTION 'No stock available';
  END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (profit_recipient_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT saldo_pen INTO buyer_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;
  IF buyer_balance < public_price THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before purchasing';
  END IF;

  IF profit_recipient_id IS DISTINCT FROM actor_id THEN
    SELECT saldo_pen INTO admin_balance
    FROM public.wallet_balances
    WHERE user_id = profit_recipient_id
    FOR UPDATE;
    buyer_final_balance := buyer_balance - public_price;
    admin_final_balance := admin_balance + profit_amount;
    UPDATE public.wallet_balances SET saldo_pen = buyer_final_balance WHERE user_id = actor_id;
    UPDATE public.wallet_balances SET saldo_pen = admin_final_balance WHERE user_id = profit_recipient_id;
  ELSE
    buyer_final_balance := buyer_balance - public_price + profit_amount;
    admin_final_balance := buyer_final_balance;
    UPDATE public.wallet_balances SET saldo_pen = buyer_final_balance WHERE user_id = actor_id;
  END IF;

  expiration_date := (now() AT TIME ZONE 'America/Lima')::date + COALESCE(product_row.duration_days, 30);
  enabled_auto_renew := COALESCE(p_auto_renew, false) AND COALESCE(product_row.is_renewable, true);

  INSERT INTO public.orders (
    user_id, created_by, client_id, producto_id, producto_nombre, precio,
    unit_cost_pen, cost_total_pen, sale_price_pen, profit_pen,
    auto_renew, auto_renew_at, fecha_vencimiento, estado, payment_verified,
    storefront_owner_id, store_product_override_id
  ) VALUES (
    actor_id, actor_id, actor_id, product_row.id::text,
    COALESCE(listing.custom_name, product_row.name), public_price,
    wholesale_cost, wholesale_cost, public_price, profit_amount,
    enabled_auto_renew,
    CASE WHEN enabled_auto_renew THEN expiration_date - 3 ELSE NULL END,
    expiration_date, 'entregado', true,
    resolved_store_owner_id, listing.id
  ) RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = created_order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT created_order_id, actor_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = inventory_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description
  ) VALUES (
    actor_id, -public_price, buyer_balance - public_price, 'storefront_purchase', created_order_id,
    format('Compra en tienda pública %s', p_store_slug)
  );

  IF profit_amount > 0 THEN
    INSERT INTO public.wallet_transactions (
      user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description
    ) VALUES (
      profit_recipient_id, profit_amount, admin_final_balance, 'storefront_sale_profit', created_order_id,
      format('Utilidad de venta en tienda %s', p_store_slug)
    );
  END IF;

  INSERT INTO public.owner_notifications (
    user_id, product_id, catalog_order_id, notification_type, title, body
  ) VALUES (
    profit_recipient_id, product_row.id, created_order_id, 'storefront_sale',
    'Nueva venta en tienda pública',
    format('Se vendió %s en %s. Utilidad acreditada: S/ %s.', COALESCE(listing.custom_name, product_row.name), p_store_slug, to_char(profit_amount, 'FM999999990.00'))
  );

  PERFORM private.log_admin_event(
    'storefront_sale', 'orders', created_order_id,
    'Nueva venta en tienda pública',
    format('%s vendió %s. Utilidad acreditada: S/ %s.', p_store_slug, COALESCE(listing.custom_name, product_row.name), to_char(profit_amount, 'FM999999990.00')),
    jsonb_build_object('screen', 'orders', 'storeOwnerId', resolved_store_owner_id, 'orderId', created_order_id)
  );

  RETURN QUERY SELECT created_order_id, public_price, profit_amount, expiration_date;
END;
$$;

REVOKE ALL ON FUNCTION public.place_storefront_catalog_order_from_wallet(text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_storefront_catalog_order_from_wallet(text, uuid, boolean) TO authenticated, service_role;

COMMENT ON FUNCTION public.place_storefront_catalog_order_from_wallet(text, uuid, boolean)
IS 'Compra pública atómica: debita al comprador, entrega inventario y acredita solo la utilidad configurada al administrador.';
