-- CRM de clientes comerciales. Los perfiles de Auth siguen representando a
-- usuarios del marketplace; esta tabla permite que un vendedor registre también
-- clientes externos sin crearles una cuenta ni mezclar carteras de clientes.

CREATE TABLE IF NOT EXISTS public.business_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre text NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 2 AND 160),
  telefono text NULL CHECK (telefono IS NULL OR char_length(btrim(telefono)) BETWEEN 5 AND 32),
  email text NULL CHECK (email IS NULL OR char_length(btrim(email)) BETWEEN 5 AND 320),
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_clients_owner_profile_key
  ON public.business_clients(owner_id, profile_id)
  WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS business_clients_owner_created_idx
  ON public.business_clients(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS business_clients_owner_search_idx
  ON public.business_clients(owner_id, lower(nombre));

CREATE TABLE IF NOT EXISTS public.business_client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 48),
  color text NOT NULL DEFAULT '#ef233c' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);

CREATE TABLE IF NOT EXISTS public.business_client_tag_assignments (
  client_id uuid NOT NULL REFERENCES public.business_clients(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.business_client_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, tag_id)
);

CREATE INDEX IF NOT EXISTS business_client_tag_assignments_tag_idx
  ON public.business_client_tag_assignments(tag_id);

CREATE OR REPLACE FUNCTION public.set_business_client_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_clients_set_updated_at ON public.business_clients;
CREATE TRIGGER business_clients_set_updated_at
BEFORE UPDATE ON public.business_clients
FOR EACH ROW EXECUTE FUNCTION public.set_business_client_updated_at();

DROP TRIGGER IF EXISTS business_client_tags_set_updated_at ON public.business_client_tags;
CREATE TRIGGER business_client_tags_set_updated_at
BEFORE UPDATE ON public.business_client_tags
FOR EACH ROW EXECUTE FUNCTION public.set_business_client_updated_at();

ALTER TABLE public.business_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_client_tag_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.business_clients, public.business_client_tags, public.business_client_tag_assignments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_clients, public.business_client_tags, public.business_client_tag_assignments TO authenticated;
GRANT ALL ON public.business_clients, public.business_client_tags, public.business_client_tag_assignments TO service_role;

DROP POLICY IF EXISTS "Commercial users manage their business clients" ON public.business_clients;
CREATE POLICY "Commercial users manage their business clients"
ON public.business_clients FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    owner_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'proveedor'::public.app_role)
      OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    owner_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'proveedor'::public.app_role)
      OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
    )
  )
);

DROP POLICY IF EXISTS "Commercial users manage their business tags" ON public.business_client_tags;
CREATE POLICY "Commercial users manage their business tags"
ON public.business_client_tags FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    owner_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'proveedor'::public.app_role)
      OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    owner_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'proveedor'::public.app_role)
      OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
    )
  )
);

DROP POLICY IF EXISTS "Commercial users manage their business tag assignments" ON public.business_client_tag_assignments;
CREATE POLICY "Commercial users manage their business tag assignments"
ON public.business_client_tag_assignments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_clients AS client
    WHERE client.id = client_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          client.owner_id = auth.uid()
          AND (
            public.has_role(auth.uid(), 'proveedor'::public.app_role)
            OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
          )
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.business_clients AS client
    JOIN public.business_client_tags AS tag ON tag.id = tag_id
    WHERE client.id = client_id
      AND tag.owner_id = client.owner_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (
          client.owner_id = auth.uid()
          AND (
            public.has_role(auth.uid(), 'proveedor'::public.app_role)
            OR public.has_role(auth.uid(), 'distribuidor'::public.app_role)
          )
        )
      )
  )
);

-- La relación nueva es adicional: los campos legacy client_id/user_id se
-- conservan para no romper entregas ni compras de usuarios ya registrados.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS business_client_id uuid REFERENCES public.business_clients(id) ON DELETE SET NULL;
ALTER TABLE public.social_service_orders
  ADD COLUMN IF NOT EXISTS business_client_id uuid REFERENCES public.business_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_business_client_created_idx
  ON public.orders(business_client_id, created_at DESC)
  WHERE business_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS social_service_orders_business_client_created_idx
  ON public.social_service_orders(business_client_id, created_at DESC)
  WHERE business_client_id IS NOT NULL;

-- Conserva el historial: por cada vendedor y cliente registrado se crea un
-- registro CRM y se vinculan los pedidos existentes sin modificar montos.
INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
SELECT DISTINCT
  COALESCE(order_row.created_by, order_row.user_id) AS owner_id,
  profile.id AS profile_id,
  COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente') AS nombre,
  profile.whatsapp,
  profile.email
FROM public.orders AS order_row
JOIN public.profiles AS profile ON profile.id = order_row.client_id
WHERE COALESCE(order_row.created_by, order_row.user_id) IS NOT NULL
ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL DO NOTHING;

INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
SELECT DISTINCT
  social_order.created_by AS owner_id,
  profile.id AS profile_id,
  COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente') AS nombre,
  profile.whatsapp,
  profile.email
FROM public.social_service_orders AS social_order
JOIN public.profiles AS profile ON profile.id = social_order.client_id
WHERE social_order.created_by IS NOT NULL
ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL DO NOTHING;

UPDATE public.orders AS order_row
SET business_client_id = client.id
FROM public.business_clients AS client
WHERE order_row.business_client_id IS NULL
  AND client.owner_id = COALESCE(order_row.created_by, order_row.user_id)
  AND client.profile_id = order_row.client_id;

UPDATE public.social_service_orders AS social_order
SET business_client_id = client.id
FROM public.business_clients AS client
WHERE social_order.business_client_id IS NULL
  AND client.owner_id = social_order.created_by
  AND client.profile_id = social_order.client_id;

CREATE OR REPLACE FUNCTION public.ensure_self_business_client()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  result_id uuid;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to access clients';
  END IF;

  INSERT INTO public.business_clients (owner_id, profile_id, nombre, telefono, email)
  SELECT
    actor_id,
    actor_id,
    COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Mi cuenta'),
    profile.whatsapp,
    profile.email
  FROM public.profiles AS profile
  WHERE profile.id = actor_id
  ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
  DO UPDATE SET
    nombre = EXCLUDED.nombre,
    telefono = EXCLUDED.telefono,
    email = EXCLUDED.email
  RETURNING id INTO result_id;

  IF result_id IS NULL THEN
    INSERT INTO public.business_clients (owner_id, profile_id, nombre)
    VALUES (actor_id, actor_id, 'Mi cuenta')
    ON CONFLICT (owner_id, profile_id) WHERE profile_id IS NOT NULL
    DO UPDATE SET updated_at = now()
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_client_metrics(p_owner_id uuid DEFAULT NULL)
RETURNS TABLE(total_clients bigint, active_clients bigint, inactive_clients bigint, blocked_clients bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  selected_owner_id uuid;
  is_admin boolean;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view client metrics';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view clients';
  END IF;

  IF p_owner_id IS NOT NULL AND NOT is_admin AND p_owner_id IS DISTINCT FROM actor_id THEN
    RAISE EXCEPTION 'You can only view your own clients';
  END IF;
  selected_owner_id := CASE WHEN is_admin THEN p_owner_id ELSE actor_id END;

  RETURN QUERY
  WITH scoped_clients AS (
    SELECT client.id, client.is_blocked
    FROM public.business_clients AS client
    WHERE selected_owner_id IS NULL OR client.owner_id = selected_owner_id
  ), activity AS (
    SELECT business_client_id AS client_id, max(created_at) AS last_purchase
    FROM public.orders
    WHERE business_client_id IS NOT NULL
    GROUP BY business_client_id
    UNION ALL
    SELECT business_client_id AS client_id, max(created_at) AS last_purchase
    FROM public.social_service_orders
    WHERE business_client_id IS NOT NULL
    GROUP BY business_client_id
  ), recent_activity AS (
    SELECT client_id, max(last_purchase) AS last_purchase
    FROM activity
    GROUP BY client_id
  )
  SELECT
    count(*)::bigint,
    count(*) FILTER (
      WHERE NOT client.is_blocked
        AND recent.last_purchase >= now() - interval '30 days'
    )::bigint,
    count(*) FILTER (
      WHERE NOT client.is_blocked
        AND (recent.last_purchase IS NULL OR recent.last_purchase < now() - interval '30 days')
    )::bigint,
    count(*) FILTER (WHERE client.is_blocked)::bigint
  FROM scoped_clients AS client
  LEFT JOIN recent_activity AS recent ON recent.client_id = client.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_business_clients(p_owner_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  owner_id uuid,
  nombre text,
  telefono text,
  email text,
  is_blocked boolean,
  created_at timestamptz,
  total_purchases bigint,
  total_spent_pen numeric,
  last_purchase timestamptz,
  tags jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  selected_owner_id uuid;
  is_admin boolean;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view clients';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view clients';
  END IF;

  IF p_owner_id IS NOT NULL AND NOT is_admin AND p_owner_id IS DISTINCT FROM actor_id THEN
    RAISE EXCEPTION 'You can only view your own clients';
  END IF;
  selected_owner_id := CASE WHEN is_admin THEN p_owner_id ELSE actor_id END;

  RETURN QUERY
  WITH catalog_orders AS (
    SELECT business_client_id AS client_id, created_at, COALESCE(sale_price_pen, precio, 0)::numeric AS amount
    FROM public.orders
    WHERE business_client_id IS NOT NULL
    UNION ALL
    SELECT business_client_id AS client_id, created_at, COALESCE(sale_price_pen, 0)::numeric AS amount
    FROM public.social_service_orders
    WHERE business_client_id IS NOT NULL
  ), purchase_metrics AS (
    SELECT client_id, count(*)::bigint AS total_purchases, sum(amount)::numeric AS total_spent_pen, max(created_at) AS last_purchase
    FROM catalog_orders
    GROUP BY client_id
  ), tag_data AS (
    SELECT assignment.client_id,
      jsonb_agg(jsonb_build_object('id', tag.id, 'name', tag.name, 'color', tag.color) ORDER BY tag.name) AS tags
    FROM public.business_client_tag_assignments AS assignment
    JOIN public.business_client_tags AS tag ON tag.id = assignment.tag_id
    GROUP BY assignment.client_id
  )
  SELECT
    client.id,
    client.owner_id,
    client.nombre,
    client.telefono,
    client.email,
    client.is_blocked,
    client.created_at,
    COALESCE(metrics.total_purchases, 0),
    COALESCE(metrics.total_spent_pen, 0),
    metrics.last_purchase,
    COALESCE(tag_data.tags, '[]'::jsonb)
  FROM public.business_clients AS client
  LEFT JOIN purchase_metrics AS metrics ON metrics.client_id = client.id
  LEFT JOIN tag_data ON tag_data.client_id = client.id
  WHERE selected_owner_id IS NULL OR client.owner_id = selected_owner_id
  ORDER BY client.nombre ASC, client.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_self_business_client() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_client_metrics(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_business_clients(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_self_business_client() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_business_client_metrics(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_business_clients(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_business_client_owners()
RETURNS TABLE(owner_id uuid, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  is_admin boolean;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view client owners';
  END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin
    AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view clients';
  END IF;

  RETURN QUERY
  SELECT DISTINCT client.owner_id,
    COALESCE(NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Vendedor')
  FROM public.business_clients AS client
  LEFT JOIN public.profiles AS profile ON profile.id = client.owner_id
  WHERE is_admin OR client.owner_id = actor_id
  ORDER BY 2 ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_business_client_owners() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_client_owners() TO authenticated, service_role;

-- El selector del checkout pasa a usar el CRM y ya no expone perfiles globales.
CREATE OR REPLACE FUNCTION public.get_catalog_order_clients()
RETURNS TABLE(id uuid, nombre_completo text, whatsapp text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  can_resell boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to view clients';
  END IF;

  can_resell :=
    public.has_role(actor_id, 'admin'::public.app_role)
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  IF can_resell THEN
    RETURN QUERY
    SELECT client.id, client.nombre, client.telefono
    FROM public.business_clients AS client
    WHERE public.has_role(actor_id, 'admin'::public.app_role) OR client.owner_id = actor_id
    ORDER BY client.nombre ASC;
  ELSE
    RETURN QUERY
    SELECT client.id, client.nombre, client.telefono
    FROM public.business_clients AS client
    WHERE client.id = public.ensure_self_business_client();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalog_order_clients() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_catalog_order_clients() TO authenticated, service_role;

-- El checkout conserva las columnas legacy para entregas a usuarios registrados,
-- pero autoriza y registra siempre el cliente CRM seleccionado.
CREATE OR REPLACE FUNCTION public.place_catalog_order_from_wallet(
  p_product_id uuid,
  p_client_id uuid,
  p_sale_price_pen numeric,
  p_auto_renew boolean DEFAULT false
)
RETURNS TABLE(
  order_id uuid,
  charged_pen numeric,
  charged_usd numeric,
  sale_price_pen numeric,
  profit_pen numeric,
  expires_on date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  product_row public.products%ROWTYPE;
  client_row public.business_clients%ROWTYPE;
  inventory_id uuid;
  created_order_id uuid;
  recipient_user_id uuid;
  wholesale_cost numeric(16, 6);
  current_balance numeric(16, 6);
  debit_amount numeric(16, 6);
  normalized_sale_price numeric(16, 2);
  margin_amount numeric(16, 2);
  default_markup_percent numeric(7, 3) := 20;
  pen_per_usd_setting numeric(12, 6) := 3.700000;
  expiration_date date;
  can_resell boolean := false;
  is_admin boolean := false;
  enable_auto_renew boolean := false;
BEGIN
  IF actor_id IS NULL OR p_client_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and a client are required to place a catalog order';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  can_resell := is_admin
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);

  SELECT * INTO client_row
  FROM public.business_clients
  WHERE id = p_client_id
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected client does not exist';
  END IF;
  IF (NOT is_admin AND client_row.owner_id IS DISTINCT FROM actor_id)
    OR (NOT can_resell AND client_row.profile_id IS DISTINCT FROM actor_id) THEN
    RAISE EXCEPTION 'You cannot assign orders to this client';
  END IF;

  SELECT * INTO product_row
  FROM public.products
  WHERE id = p_product_id
    AND COALESCE(is_active, true)
    AND COALESCE(is_catalog_available, true)
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  SELECT COALESCE(cost.unit_cost_pen, product_row.price)
  INTO wholesale_cost
  FROM public.catalog_product_costs AS cost
  WHERE cost.product_id = p_product_id;
  wholesale_cost := COALESCE(wholesale_cost, product_row.price);

  SELECT settings.default_markup_percent, settings.pen_per_usd
  INTO default_markup_percent, pen_per_usd_setting
  FROM public.catalog_pricing_settings AS settings
  WHERE settings.id = 'default';
  default_markup_percent := COALESCE(default_markup_percent, 20);
  pen_per_usd_setting := COALESCE(pen_per_usd_setting, 3.700000);

  IF can_resell THEN
    normalized_sale_price := round(COALESCE(p_sale_price_pen, 0), 2);
    IF normalized_sale_price < wholesale_cost THEN
      RAISE EXCEPTION 'Sale price must cover the product cost';
    END IF;
    debit_amount := wholesale_cost;
  ELSE
    normalized_sale_price := GREATEST(
      round(product_row.price, 2),
      round(wholesale_cost * (1 + default_markup_percent / 100), 2)
    );
    debit_amount := normalized_sale_price;
  END IF;

  SELECT ai.id INTO inventory_id
  FROM public.account_inventory AS ai
  WHERE ai.product_id = p_product_id
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
  SELECT saldo_pen INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;
  IF current_balance < debit_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;

  expiration_date := (now() AT TIME ZONE 'America/Lima')::date + product_row.duration_days;
  enable_auto_renew := COALESCE(p_auto_renew, false) AND COALESCE(product_row.is_renewable, true);
  margin_amount := round(normalized_sale_price - wholesale_cost, 2);
  -- Los clientes externos no tienen sesión. El vendedor conserva la entrega
  -- protegida y puede enviarla manualmente; un cliente con perfil recibe su propia entrega.
  recipient_user_id := COALESCE(client_row.profile_id, actor_id);

  INSERT INTO public.orders (
    user_id, created_by, client_id, business_client_id, producto_id, producto_nombre, precio,
    unit_cost_pen, cost_total_pen, sale_price_pen, profit_pen, auto_renew,
    auto_renew_at, fecha_vencimiento, estado, payment_verified
  ) VALUES (
    recipient_user_id, actor_id, client_row.profile_id, client_row.id, p_product_id::text,
    product_row.name, normalized_sale_price, wholesale_cost, debit_amount,
    normalized_sale_price, margin_amount, enable_auto_renew,
    CASE WHEN enable_auto_renew THEN expiration_date - 3 ELSE NULL END,
    expiration_date, 'entregado', true
  ) RETURNING id INTO created_order_id;

  UPDATE public.account_inventory
  SET status = 'assigned', order_id = created_order_id, assigned_at = now(), payment_verified = true
  WHERE id = inventory_id;

  INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
  SELECT created_order_id, recipient_user_id, email, password, access_link, notes
  FROM public.account_inventory
  WHERE id = inventory_id;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - debit_amount
  WHERE user_id = actor_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, catalog_order_id, description
  ) VALUES (
    actor_id, -debit_amount, current_balance - debit_amount, 'catalog_order_cost', created_order_id,
    CASE WHEN can_resell THEN 'Costo de pedido de catálogo para cliente CRM' ELSE 'Compra de catálogo' END
  );

  RETURN QUERY SELECT created_order_id, debit_amount,
    round(debit_amount / pen_per_usd_setting, 2), normalized_sale_price,
    margin_amount, expiration_date;
END;
$$;

REVOKE ALL ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_catalog_order_from_wallet(uuid, uuid, numeric, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.place_social_service_order(
  p_service_id uuid,
  p_client_id uuid,
  p_target_url text,
  p_quantity integer,
  p_sale_price_pen numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id uuid := auth.uid();
  service_row public.social_service_catalog%ROWTYPE;
  client_row public.business_clients%ROWTYPE;
  current_balance numeric(16, 6);
  total_cost numeric(16, 6);
  configured_provider_key text;
  integration_is_configured boolean;
  normalized_url text := btrim(p_target_url);
  normalized_sale_price numeric(16, 2) := round(p_sale_price_pen, 2);
  created_order_id uuid;
  can_resell boolean := false;
  is_admin boolean := false;
BEGIN
  IF actor_id IS NULL OR p_client_id IS NULL THEN
    RAISE EXCEPTION 'Authentication and a client are required to place a social service order';
  END IF;

  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  can_resell := is_admin
    OR public.has_role(actor_id, 'proveedor'::public.app_role)
    OR public.has_role(actor_id, 'distribuidor'::public.app_role);
  SELECT * INTO client_row FROM public.business_clients WHERE id = p_client_id FOR SHARE;
  IF NOT FOUND OR (NOT is_admin AND client_row.owner_id IS DISTINCT FROM actor_id)
    OR (NOT can_resell AND client_row.profile_id IS DISTINCT FROM actor_id) THEN
    RAISE EXCEPTION 'You cannot assign orders to this client';
  END IF;

  IF char_length(normalized_url) < 3 OR char_length(normalized_url) > 2048 THEN
    RAISE EXCEPTION 'A valid target link is required';
  END IF;
  SELECT provider_key, is_configured
  INTO configured_provider_key, integration_is_configured
  FROM public.social_service_provider_status
  WHERE id = 'default';
  IF NOT COALESCE(integration_is_configured, false) THEN
    RAISE EXCEPTION 'The SMM provider is not configured yet';
  END IF;

  SELECT * INTO service_row
  FROM public.social_service_catalog
  WHERE id = p_service_id AND is_active
  FOR SHARE;
  IF NOT FOUND OR service_row.provider_key IS DISTINCT FROM configured_provider_key THEN
    RAISE EXCEPTION 'The selected social service is unavailable';
  END IF;
  IF p_quantity < service_row.min_quantity OR p_quantity > service_row.max_quantity THEN
    RAISE EXCEPTION 'Quantity must be between % and %', service_row.min_quantity, service_row.max_quantity;
  END IF;

  total_cost := round(service_row.unit_cost_pen * p_quantity, 6);
  IF normalized_sale_price IS NULL OR normalized_sale_price < total_cost THEN
    RAISE EXCEPTION 'Sale price must cover the service cost';
  END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen)
  VALUES (actor_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  SELECT saldo_pen INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;
  IF current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;

  UPDATE public.wallet_balances SET saldo_pen = saldo_pen - total_cost WHERE user_id = actor_id;
  INSERT INTO public.social_service_orders (
    created_by, client_id, business_client_id, service_id, provider_key, provider_service_id,
    platform, category, service_name, target_url, quantity, unit_cost_pen,
    cost_total_pen, sale_price_pen, profit_pen
  ) VALUES (
    actor_id, client_row.profile_id, client_row.id, service_row.id, service_row.provider_key,
    service_row.provider_service_id, service_row.platform, service_row.category,
    service_row.name, normalized_url, p_quantity, service_row.unit_cost_pen,
    total_cost, normalized_sale_price, normalized_sale_price - total_cost
  ) RETURNING id INTO created_order_id;

  INSERT INTO public.wallet_transactions (
    user_id, amount_pen, balance_after_pen, transaction_type, social_service_order_id, description
  ) VALUES (
    actor_id, -total_cost, current_balance - total_cost, 'social_service_cost', created_order_id,
    'Costo de servicio de redes sociales para cliente CRM'
  );
  RETURN created_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_social_service_order(uuid, uuid, text, integer, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_social_service_order(uuid, uuid, text, integer, numeric) TO authenticated, service_role;
