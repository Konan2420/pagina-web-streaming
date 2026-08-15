REVOKE EXECUTE ON FUNCTION public.get_stock_counts(uuid[]) FROM anon, PUBLIC;

CREATE OR REPLACE VIEW public.stock_counts AS
  SELECT ai.product_id, COUNT(*)::int AS available
  FROM public.account_inventory ai
  WHERE ai.status IN ('available', 'disponible')
  GROUP BY ai.product_id;

GRANT SELECT ON public.stock_counts TO anon, authenticated;
GRANT ALL ON public.stock_counts TO service_role;