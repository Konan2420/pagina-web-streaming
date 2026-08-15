-- 1. Comisión y contador de reseñas en el perfil de proveedor
ALTER TABLE public.supplier_profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS total_reviews integer NOT NULL DEFAULT 0;

ALTER TABLE public.supplier_profiles
  ADD CONSTRAINT supplier_profiles_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Evitar que un proveedor se auto-asigne comisión: restringimos las columnas vía trigger
CREATE OR REPLACE FUNCTION public.protect_supplier_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.commission_rate := OLD.commission_rate;
  END IF;
  IF NEW.rating IS DISTINCT FROM OLD.rating
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.rating := OLD.rating;
  END IF;
  IF NEW.total_reviews IS DISTINCT FROM OLD.total_reviews
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.total_reviews := OLD.total_reviews;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS supplier_profiles_protect_commission ON public.supplier_profiles;
CREATE TRIGGER supplier_profiles_protect_commission
BEFORE UPDATE ON public.supplier_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_supplier_commission();

-- 2. Tabla de calificaciones
CREATE TABLE IF NOT EXISTS public.supplier_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, order_id)
);

GRANT SELECT ON public.supplier_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_ratings TO authenticated;
GRANT ALL ON public.supplier_ratings TO service_role;

ALTER TABLE public.supplier_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are publicly readable"
ON public.supplier_ratings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can create their own ratings"
ON public.supplier_ratings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.supplier_ratings FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete ratings"
ON public.supplier_ratings FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER supplier_ratings_set_updated_at
BEFORE UPDATE ON public.supplier_ratings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier ON public.supplier_ratings(supplier_id);

-- 3. Recalcular promedio en el perfil del proveedor
CREATE OR REPLACE FUNCTION public.refresh_supplier_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _sid uuid;
BEGIN
  FOR _sid IN SELECT DISTINCT s FROM unnest(ARRAY[NEW.supplier_id, OLD.supplier_id]) AS s WHERE s IS NOT NULL LOOP
    UPDATE public.supplier_profiles sp
    SET rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.supplier_ratings r WHERE r.supplier_id = _sid), 0),
        total_reviews = (SELECT COUNT(*) FROM public.supplier_ratings r WHERE r.supplier_id = _sid)
    WHERE sp.user_id = _sid;
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS supplier_ratings_refresh ON public.supplier_ratings;
CREATE TRIGGER supplier_ratings_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.supplier_ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_supplier_rating();