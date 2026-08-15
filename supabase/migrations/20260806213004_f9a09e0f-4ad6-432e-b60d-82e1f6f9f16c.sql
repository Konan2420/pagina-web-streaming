REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _account_id UUID;
    _user_id UUID;
    _caller UUID := auth.uid();
BEGIN
    IF _caller IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT user_id INTO _user_id FROM public.orders WHERE id = _order_id;

    IF _user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF _user_id <> _caller AND NOT public.has_role(_caller, 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT id INTO _account_id
    FROM public.account_inventory
    WHERE product_id = _product_id AND status = 'available'
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF _account_id IS NULL THEN
        RETURN FALSE;
    END IF;

    UPDATE public.account_inventory
    SET status = 'assigned',
        order_id = _order_id,
        assigned_at = NOW()
    WHERE id = _account_id;

    INSERT INTO public.delivered_accounts (order_id, user_id, email, password, access_link, notes)
    SELECT _order_id, _user_id, email, password, access_link, notes
    FROM public.account_inventory
    WHERE id = _account_id;

    UPDATE public.orders
    SET estado = 'entregado',
        updated_at = NOW()
    WHERE id = _order_id;

    RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;