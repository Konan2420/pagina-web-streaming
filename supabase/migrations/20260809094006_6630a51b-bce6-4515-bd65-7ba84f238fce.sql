-- The account-delivery routine is a privileged SECURITY DEFINER function.
-- It is no longer invoked from the browser (delivery is triggered by trusted
-- server code after an admin verifies payment), so signed-in users must not be
-- able to call it directly.
REVOKE ALL ON FUNCTION public.assign_inventory_to_order(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_inventory_to_order(uuid, uuid) TO service_role;

-- Keep the streaming variant server-only too (idempotent hardening).
REVOKE ALL ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_cuenta_streaming(uuid, text, numeric, text) TO service_role;

-- Orders: admins manage state through RLS; make sure privileges back the policies
-- and that anonymous visitors have no access at all.
REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;