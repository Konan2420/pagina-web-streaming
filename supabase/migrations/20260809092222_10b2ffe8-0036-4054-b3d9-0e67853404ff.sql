DROP VIEW IF EXISTS public.stock_counts;

CREATE TABLE public.product_stock (
  product_id uuid PRIMARY KEY,
  available int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_stock TO anon, authenticated;
GRANT ALL ON public.product_stock TO service_role;

ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stock counts are public" ON public.product_stock FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.refresh_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pid uuid;
BEGIN
  FOR _pid IN SELECT DISTINCT p FROM unnest(ARRAY[NEW.product_id, OLD.product_id]) AS p WHERE p IS NOT NULL LOOP
    INSERT INTO public.product_stock (product_id, available, updated_at)
    VALUES (_pid, (SELECT COUNT(*) FROM public.account_inventory ai WHERE ai.product_id = _pid AND ai.status IN ('available','disponible')), now())
    ON CONFLICT (product_id) DO UPDATE SET available = EXCLUDED.available, updated_at = now();
  END LOOP;
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_product_stock() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER account_inventory_stock_sync
AFTER INSERT OR UPDATE OR DELETE ON public.account_inventory
FOR EACH ROW EXECUTE FUNCTION public.refresh_product_stock();

INSERT INTO public.product_stock (product_id, available)
SELECT ai.product_id, COUNT(*) FILTER (WHERE ai.status IN ('available','disponible'))
FROM public.account_inventory ai
WHERE ai.product_id IS NOT NULL
GROUP BY ai.product_id
ON CONFLICT (product_id) DO UPDATE SET available = EXCLUDED.available;