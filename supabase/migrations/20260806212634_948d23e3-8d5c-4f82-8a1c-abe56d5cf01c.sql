BEGIN;

-- 1. Create account_inventory table
CREATE TABLE IF NOT EXISTS public.account_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    access_link TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_at TIMESTAMPTZ
);

-- 2. Enable RLS
ALTER TABLE public.account_inventory ENABLE ROW LEVEL SECURITY;

-- 3. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_inventory TO authenticated;
GRANT ALL ON public.account_inventory TO service_role;

-- 4. Policies
CREATE POLICY "Admins can manage account inventory" 
ON public.account_inventory 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Atomic auto-assignment function
CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id UUID, _product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _account_id UUID;
    _user_id UUID;
BEGIN
    -- Get user_id from order
    SELECT user_id INTO _user_id FROM public.orders WHERE id = _order_id;
    
    -- Find and lock the oldest available account for this product
    SELECT id INTO _account_id
    FROM public.account_inventory
    WHERE product_id = _product_id AND status = 'available'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF _account_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update inventory status
    UPDATE public.account_inventory
    SET status = 'assigned',
        order_id = _order_id,
        assigned_at = NOW()
    WHERE id = _account_id;

    -- Insert into delivered_accounts for the user to see (reusing existing UI logic)
    INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
    SELECT _order_id, _user_id, email, password, access_link, notes
    FROM public.account_inventory
    WHERE id = _account_id;

    -- Update order status to delivered
    UPDATE public.orders
    SET estado = 'entregado',
        updated_at = NOW()
    WHERE id = _order_id;

    RETURN TRUE;
END;
$$;

COMMIT;