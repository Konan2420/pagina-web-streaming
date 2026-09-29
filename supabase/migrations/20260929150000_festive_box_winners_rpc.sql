-- Admin-only, credential-free read model for festive box winners.
CREATE OR REPLACE FUNCTION public.get_festive_box_winners(_event_id uuid DEFAULT NULL)
RETURNS TABLE(
  client_name text,
  product_name text,
  opened_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorized to view festive box winners';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(
      NULLIF(btrim(profile.nombre_completo), ''),
      NULLIF(btrim(profile.email), ''),
      NULLIF(btrim(account.email), ''),
      'Cliente'
    ) AS client_name,
    product.name AS product_name,
    opening.opened_at
  FROM public.festive_event_box_openings AS opening
  LEFT JOIN public.profiles AS profile ON profile.id = opening.user_id
  LEFT JOIN auth.users AS account ON account.id = opening.user_id
  JOIN public.products AS product ON product.id = opening.product_id_won
  WHERE _event_id IS NULL OR opening.event_id = _event_id
  ORDER BY opening.opened_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_festive_box_winners(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_festive_box_winners(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_festive_box_winners(uuid) IS
  'Admin-only credential-free view of festive box winners.';
