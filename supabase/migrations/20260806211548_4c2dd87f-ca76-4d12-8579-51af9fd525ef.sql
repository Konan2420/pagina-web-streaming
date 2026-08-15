CREATE TABLE public.delivered_accounts (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    email text,
    password text,
    access_link text,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

GRANT SELECT ON public.delivered_accounts TO authenticated;
GRANT ALL ON public.delivered_accounts TO service_role;

ALTER TABLE public.delivered_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivered accounts"
ON public.delivered_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all delivered accounts"
ON public.delivered_accounts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Ensure orders status can be updated to 'delivered' and 'pending_delivery'
-- Check if 'estado' column allows these values or if it's text. 
-- Based on prev read it's 'text'.

GRANT UPDATE ON public.orders TO authenticated;
