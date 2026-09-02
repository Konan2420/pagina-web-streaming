-- Generador de servicios para Redes Sociales.
-- El catálogo se mantiene vacío hasta configurar un proveedor SMM real. Las
-- claves de ese proveedor pertenecen exclusivamente al entorno de servidor.

ALTER TABLE public.wallet_balances
  ALTER COLUMN saldo_pen TYPE numeric(16, 6)
  USING saldo_pen::numeric(16, 6);

CREATE TABLE IF NOT EXISTS public.social_service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL CHECK (char_length(btrim(provider_key)) BETWEEN 2 AND 80),
  provider_service_id text NOT NULL CHECK (char_length(btrim(provider_service_id)) BETWEEN 1 AND 120),
  platform text NOT NULL CHECK (char_length(btrim(platform)) BETWEEN 2 AND 80),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 2 AND 120),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 500),
  description text,
  unit_cost_pen numeric(16, 6) NOT NULL CHECK (unit_cost_pen >= 0),
  min_quantity integer NOT NULL CHECK (min_quantity > 0),
  max_quantity integer NOT NULL CHECK (max_quantity >= min_quantity),
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  provider_updated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_service_catalog_provider_service_unique UNIQUE (provider_key, provider_service_id)
);

CREATE INDEX IF NOT EXISTS social_service_catalog_active_platform_idx
  ON public.social_service_catalog (is_active, platform, category, name);

CREATE INDEX IF NOT EXISTS social_service_catalog_featured_idx
  ON public.social_service_catalog (is_featured DESC, updated_at DESC)
  WHERE is_active;

-- Estado público, sin secretos, de la integración. La API key se mantiene en
-- el entorno del servidor; esta fila solo impide cobrar órdenes antes de que
-- exista una conexión real y muestra el proveedor que la respalda.
CREATE TABLE IF NOT EXISTS public.social_service_provider_status (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  provider_key text,
  provider_label text,
  is_configured boolean NOT NULL DEFAULT false,
  catalog_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.social_service_provider_status (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.social_service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES public.social_service_catalog(id) ON DELETE RESTRICT,
  provider_key text NOT NULL,
  provider_service_id text NOT NULL,
  platform text NOT NULL,
  category text NOT NULL,
  service_name text NOT NULL,
  target_url text NOT NULL CHECK (char_length(btrim(target_url)) BETWEEN 3 AND 2048),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost_pen numeric(16, 6) NOT NULL CHECK (unit_cost_pen >= 0),
  cost_total_pen numeric(16, 6) NOT NULL CHECK (cost_total_pen >= 0),
  sale_price_pen numeric(16, 2) NOT NULL CHECK (sale_price_pen >= 0),
  profit_pen numeric(16, 6) NOT NULL,
  status text NOT NULL DEFAULT 'pending_provider'
    CHECK (status IN ('pending_provider', 'in_progress', 'completed', 'failed', 'cancelled', 'refunded')),
  external_order_id text,
  provider_response jsonb,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_service_orders_sale_covers_cost CHECK (sale_price_pen >= cost_total_pen),
  CONSTRAINT social_service_orders_profit_matches_cost CHECK (profit_pen = sale_price_pen - cost_total_pen)
);

CREATE INDEX IF NOT EXISTS social_service_orders_creator_created_idx
  ON public.social_service_orders (created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS social_service_orders_client_created_idx
  ON public.social_service_orders (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS social_service_orders_status_created_idx
  ON public.social_service_orders (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_pen numeric(16, 6) NOT NULL CHECK (amount_pen <> 0),
  balance_after_pen numeric(16, 6) NOT NULL CHECK (balance_after_pen >= 0),
  transaction_type text NOT NULL CHECK (transaction_type IN ('social_service_cost', 'social_service_refund')),
  social_service_order_id uuid REFERENCES public.social_service_orders(id) ON DELETE SET NULL,
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 2 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_created_idx
  ON public.wallet_transactions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_social_service_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS social_service_catalog_set_updated_at ON public.social_service_catalog;
CREATE TRIGGER social_service_catalog_set_updated_at
BEFORE UPDATE ON public.social_service_catalog
FOR EACH ROW EXECUTE FUNCTION public.set_social_service_updated_at();

DROP TRIGGER IF EXISTS social_service_orders_set_updated_at ON public.social_service_orders;
CREATE TRIGGER social_service_orders_set_updated_at
BEFORE UPDATE ON public.social_service_orders
FOR EACH ROW EXECUTE FUNCTION public.set_social_service_updated_at();

DROP TRIGGER IF EXISTS social_service_provider_status_set_updated_at ON public.social_service_provider_status;
CREATE TRIGGER social_service_provider_status_set_updated_at
BEFORE UPDATE ON public.social_service_provider_status
FOR EACH ROW EXECUTE FUNCTION public.set_social_service_updated_at();

ALTER TABLE public.social_service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_service_provider_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read active social services" ON public.social_service_catalog;
CREATE POLICY "Authenticated users can read active social services"
ON public.social_service_catalog
FOR SELECT TO authenticated
USING (is_active);

DROP POLICY IF EXISTS "Admins can manage social service catalog" ON public.social_service_catalog;
CREATE POLICY "Admins can manage social service catalog"
ON public.social_service_catalog
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can read social provider status" ON public.social_service_provider_status;
CREATE POLICY "Authenticated users can read social provider status"
ON public.social_service_provider_status
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage social provider status" ON public.social_service_provider_status;
CREATE POLICY "Admins can manage social provider status"
ON public.social_service_provider_status
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read their social service orders" ON public.social_service_orders;
CREATE POLICY "Users can read their social service orders"
ON public.social_service_orders
FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR client_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Users can read their wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can read their wallet transactions"
ON public.wallet_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.social_service_catalog, public.social_service_orders, public.wallet_transactions, public.social_service_provider_status FROM anon;
GRANT SELECT ON public.social_service_catalog, public.social_service_orders, public.wallet_transactions, public.social_service_provider_status TO authenticated;
GRANT ALL ON public.social_service_catalog, public.social_service_orders, public.wallet_transactions, public.social_service_provider_status TO service_role;

-- Registra el pedido y cobra únicamente a la cuenta autenticada que lo crea.
-- La llamada al proveedor externo queda fuera de PostgreSQL: el servidor la
-- realizará después de registrar un servicio real y nunca desde el navegador.
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
  current_balance numeric(16, 6);
  total_cost numeric(16, 6);
  configured_provider_key text;
  integration_is_configured boolean;
  normalized_url text := btrim(p_target_url);
  normalized_sale_price numeric(16, 2) := round(p_sale_price_pen, 2);
  created_order_id uuid;
  can_assign_another_client boolean := false;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to place a social service order';
  END IF;

  IF p_client_id IS NULL THEN
    RAISE EXCEPTION 'A client is required';
  END IF;

  can_assign_another_client :=
    public.has_role(actor_id, 'admin')
    OR public.has_role(actor_id, 'proveedor')
    OR public.has_role(actor_id, 'distribuidor');

  IF p_client_id IS DISTINCT FROM actor_id AND NOT can_assign_another_client THEN
    RAISE EXCEPTION 'Only an elevated account can assign an order to another client';
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

  SELECT *
  INTO service_row
  FROM public.social_service_catalog
  WHERE id = p_service_id
    AND is_active
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected social service is unavailable';
  END IF;

  IF service_row.provider_key IS DISTINCT FROM configured_provider_key THEN
    RAISE EXCEPTION 'The selected service does not belong to the configured provider';
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

  SELECT saldo_pen
  INTO current_balance
  FROM public.wallet_balances
  WHERE user_id = actor_id
  FOR UPDATE;

  IF current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Recharge before creating the order';
  END IF;

  UPDATE public.wallet_balances
  SET saldo_pen = saldo_pen - total_cost
  WHERE user_id = actor_id;

  INSERT INTO public.social_service_orders (
    created_by,
    client_id,
    service_id,
    provider_key,
    provider_service_id,
    platform,
    category,
    service_name,
    target_url,
    quantity,
    unit_cost_pen,
    cost_total_pen,
    sale_price_pen,
    profit_pen
  ) VALUES (
    actor_id,
    p_client_id,
    service_row.id,
    service_row.provider_key,
    service_row.provider_service_id,
    service_row.platform,
    service_row.category,
    service_row.name,
    normalized_url,
    p_quantity,
    service_row.unit_cost_pen,
    total_cost,
    normalized_sale_price,
    normalized_sale_price - total_cost
  ) RETURNING id INTO created_order_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    amount_pen,
    balance_after_pen,
    transaction_type,
    social_service_order_id,
    description
  ) VALUES (
    actor_id,
    -total_cost,
    current_balance - total_cost,
    'social_service_cost',
    created_order_id,
    'Costo de servicio de redes sociales'
  );

  RETURN created_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_social_service_order(uuid, uuid, text, integer, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_social_service_order(uuid, uuid, text, integer, numeric) TO authenticated, service_role;

COMMENT ON TABLE public.social_service_catalog
IS 'Cache of services from an external SMM provider. It intentionally starts empty until an API provider is configured.';
COMMENT ON TABLE public.social_service_orders
IS 'Orders generated in the Redes Sociales panel. Provider dispatch is performed by a server-side integration only.';
COMMENT ON TABLE public.wallet_transactions
IS 'Immutable wallet ledger entries created by secure server/database workflows.';
COMMENT ON TABLE public.social_service_provider_status
IS 'Non-sensitive integration state. API secrets remain server-side only.';
