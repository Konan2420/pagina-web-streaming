-- 1. Restaurar EXECUTE de has_role para usuarios autenticados (necesario para RLS y verificación de rol admin)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 2. La entrega automática solo procede si el pago está verificado o si la ejecuta un administrador
CREATE OR REPLACE FUNCTION public.assign_inventory_to_order(_order_id uuid, _product_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _account_id UUID;
    _user_id UUID;
    _paid BOOLEAN;
    _caller UUID := auth.uid();
    _is_admin BOOLEAN;
BEGIN
    IF _caller IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    _is_admin := public.has_role(_caller, 'admin');

    SELECT user_id, COALESCE(payment_verified, false)
      INTO _user_id, _paid
    FROM public.orders
    WHERE id = _order_id;

    IF _user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF _user_id <> _caller AND NOT _is_admin THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    -- Bloqueo antifraude: sin pago verificado no se entregan credenciales
    IF NOT _paid AND NOT _is_admin THEN
        RETURN FALSE;
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

REVOKE EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO authenticated, service_role;

-- 3. Payouts: solo escritura desde el servidor (service_role). Sin permisos de escritura para clientes.
REVOKE INSERT, UPDATE, DELETE ON public.payouts FROM anon, authenticated;
REVOKE ALL ON public.payouts FROM anon;
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

DROP POLICY IF EXISTS "No client writes to payouts" ON public.payouts;
CREATE POLICY "No client writes to payouts"
ON public.payouts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (false);
