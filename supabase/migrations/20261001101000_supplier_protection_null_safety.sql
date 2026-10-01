-- Una configuración ausente retorna NULL: la autorización debe fallar cerrada.
CREATE OR REPLACE FUNCTION public.protect_supplier_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trusted boolean := auth.uid() IS NULL
    OR COALESCE(public.has_role(auth.uid(), 'admin'), false);
  refreshing_rating boolean := COALESCE(current_setting('app.rating_refresh', true) = 'on', false);
BEGIN
  IF NOT trusted THEN
    NEW.commission_rate := OLD.commission_rate;
    NEW.is_verified := OLD.is_verified;
    IF NOT refreshing_rating THEN
      NEW.rating := OLD.rating;
      NEW.total_reviews := OLD.total_reviews;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
