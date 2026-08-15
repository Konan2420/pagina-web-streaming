ALTER TABLE public.account_inventory ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false;

-- Grant permissions for new columns
GRANT ALL ON public.account_inventory TO service_role;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT ON public.account_inventory TO authenticated;
GRANT SELECT ON public.orders TO authenticated;
