-- Corrige la ambigüedad entre los nombres de columnas de la CTE y las
-- variables implícitas que PostgreSQL crea para RETURNS TABLE en PL/pgSQL.
-- Es una corrección no destructiva: no borra datos ni altera las políticas RLS.

CREATE OR REPLACE FUNCTION public.get_business_order_rows_with_automation(p_scope text DEFAULT 'mine')
RETURNS TABLE(
  order_id uuid, source text, seller_id uuid, business_client_id uuid, client_profile_id uuid,
  product_id text, product_name text, product_image_url text, account_reference text,
  client_name text, client_phone text, client_avatar_url text, brand text,
  created_at timestamptz, expires_at timestamptz, business_status text, technical_status text,
  display_status text, cost_price numeric, sale_price numeric, profit numeric,
  is_renewable boolean, auto_renew boolean, auto_renew_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE actor_id uuid := auth.uid(); is_admin boolean := false;
BEGIN
  IF actor_id IS NULL THEN RAISE EXCEPTION 'Authentication is required to view business orders'; END IF;
  is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  IF NOT is_admin AND NOT public.has_role(actor_id, 'proveedor'::public.app_role)
    AND NOT public.has_role(actor_id, 'distribuidor'::public.app_role) THEN
    RAISE EXCEPTION 'Only commercial roles can view business orders';
  END IF;
  IF p_scope NOT IN ('mine', 'all') THEN RAISE EXCEPTION 'Invalid business order scope'; END IF;
  IF p_scope = 'all' AND NOT is_admin THEN RAISE EXCEPTION 'Only administrators can view all business orders'; END IF;

  RETURN QUERY
  WITH base_rows AS (
    SELECT order_row.id, 'catalog'::text, COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id),
      order_row.business_client_id, client.profile_id, order_row.producto_id, order_row.producto_nombre,
      product.image_url, order_row.account_reference,
      COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
      COALESCE(client.telefono, profile.whatsapp), profile.avatar_url,
      COALESCE(NULLIF(product.category, ''), 'Catálogo'), order_row.created_at, order_row.expires_at,
      order_row.business_status, order_row.estado, COALESCE(product.is_renewable, false),
      COALESCE(order_row.auto_renew, false), order_row.auto_renew_at,
      order_row.unit_cost_pen, order_row.sale_price_pen, order_row.profit_pen
    FROM public.orders AS order_row
    LEFT JOIN public.business_clients AS client ON client.id = order_row.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, order_row.client_id, order_row.user_id)
    LEFT JOIN public.products AS product ON product.id::text = order_row.producto_id
    WHERE (p_scope = 'all' AND is_admin) OR COALESCE(order_row.storefront_owner_id, order_row.created_by, order_row.user_id) = actor_id
    UNION ALL
    SELECT social_order.id, 'social'::text, social_order.created_by, social_order.business_client_id,
      client.profile_id, social_order.service_id::text, social_order.service_name, NULL::text,
      social_order.target_url, COALESCE(NULLIF(client.nombre, ''), NULLIF(profile.nombre_completo, ''), NULLIF(profile.email, ''), 'Cliente'),
      COALESCE(client.telefono, profile.whatsapp), profile.avatar_url, COALESCE(NULLIF(social_order.platform, ''), 'Redes Sociales'),
      social_order.created_at, social_order.expires_at, social_order.business_status, social_order.status,
      false, false, NULL::timestamptz, social_order.unit_cost_pen, social_order.sale_price_pen, social_order.profit_pen
    FROM public.social_service_orders AS social_order
    LEFT JOIN public.business_clients AS client ON client.id = social_order.business_client_id
    LEFT JOIN public.profiles AS profile ON profile.id = COALESCE(client.profile_id, social_order.client_id)
    WHERE (p_scope = 'all' AND is_admin) OR social_order.created_by = actor_id
  )
  SELECT
    rows.id,
    rows.source,
    rows.seller_id,
    rows.business_client_id,
    rows.profile_id,
    rows.producto_id,
    rows.producto_nombre,
    rows.image_url,
    rows.account_reference,
    rows.client_name,
    rows.client_phone,
    rows.avatar_url,
    rows.brand,
    rows.created_at,
    rows.expires_at,
    rows.business_status,
    rows.estado,
    CASE
      WHEN rows.business_status <> 'en_curso' THEN rows.business_status
      WHEN rows.source = 'social' AND lower(rows.estado) IN ('completed', 'completado') THEN 'completado'
      WHEN rows.source = 'social' AND lower(rows.estado) IN ('failed', 'failure', 'cancelled', 'canceled', 'cancelado') THEN 'cancelado'
      WHEN rows.expires_at IS NULL THEN 'en_curso'
      WHEN rows.expires_at <= now() THEN 'vencido'
      WHEN rows.expires_at <= now() + interval '3 days' THEN 'por_vencer'
      ELSE 'en_curso'
    END,
    COALESCE(rows.unit_cost_pen, 0),
    COALESCE(rows.sale_price_pen, 0),
    COALESCE(rows.profit_pen, 0),
    rows.is_renewable,
    rows.auto_renew,
    rows.auto_renew_at
  FROM base_rows AS rows;
END;
$$;

REVOKE ALL ON FUNCTION public.get_business_order_rows_with_automation(text) FROM PUBLIC, anon, authenticated;
