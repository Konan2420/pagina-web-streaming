CREATE OR REPLACE FUNCTION public.protect_supplier_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _trusted boolean := auth.uid() IS NULL
    OR current_setting('app.rating_refresh', true) = 'on'
    OR public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  IF NOT _trusted THEN
    NEW.commission_rate := OLD.commission_rate;
    NEW.rating := OLD.rating;
    NEW.total_reviews := OLD.total_reviews;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_supplier_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _sid uuid;
BEGIN
  PERFORM set_config('app.rating_refresh', 'on', true);
  FOR _sid IN SELECT DISTINCT s FROM unnest(ARRAY[NEW.supplier_id, OLD.supplier_id]) AS s WHERE s IS NOT NULL LOOP
    UPDATE public.supplier_profiles sp
    SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.supplier_ratings r WHERE r.supplier_id = _sid), 0),
        total_reviews = (SELECT COUNT(*) FROM public.supplier_ratings r WHERE r.supplier_id = _sid)
    WHERE sp.user_id = _sid;
  END LOOP;
  PERFORM set_config('app.rating_refresh', 'off', true);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_supplier_commission() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_supplier_rating() FROM PUBLIC, anon, authenticated;