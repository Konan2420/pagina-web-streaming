CREATE OR REPLACE FUNCTION public.protect_supplier_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _trusted boolean := auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role);
BEGIN
  IF NOT _trusted THEN
    NEW.commission_rate := OLD.commission_rate;
    NEW.rating := OLD.rating;
    NEW.total_reviews := OLD.total_reviews;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_supplier_commission() FROM PUBLIC, anon, authenticated;