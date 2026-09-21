-- Corrige el RPC del listado CRM: created_at chocaba con la columna de salida
-- declarada por RETURNS TABLE y provocaba SQLSTATE 42702 (ambiguous column).
ALTER TABLE public.business_clients
  ADD COLUMN IF NOT EXISTS birthday date;

DROP FUNCTION IF EXISTS public.get_business_clients(uuid);

CREATE OR REPLACE FUNCTION public.get_business_clients(p_owner_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  owner_id uuid,
  nombre text,
  telefono text,
  email text,
  birthday date,
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
    SELECT
      orders.business_client_id AS client_id,
      orders.created_at AS order_created_at,
      COALESCE(orders.sale_price_pen, orders.precio, 0)::numeric AS amount
    FROM public.orders AS orders
    WHERE orders.business_client_id IS NOT NULL
    UNION ALL
    SELECT
      social_orders.business_client_id AS client_id,
      social_orders.created_at AS order_created_at,
      COALESCE(social_orders.sale_price_pen, 0)::numeric AS amount
    FROM public.social_service_orders AS social_orders
    WHERE social_orders.business_client_id IS NOT NULL
  ), purchase_metrics AS (
    SELECT
      catalog_orders.client_id,
      count(*)::bigint AS total_purchases,
      sum(catalog_orders.amount)::numeric AS total_spent_pen,
      max(catalog_orders.order_created_at) AS last_purchase
    FROM catalog_orders
    GROUP BY catalog_orders.client_id
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
    client.birthday,
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

REVOKE ALL ON FUNCTION public.get_business_clients(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_business_clients(uuid) TO authenticated, service_role;
