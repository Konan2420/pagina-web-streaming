-- El panel actualizado usa get_business_orders_with_automation(), que no
-- devuelve correos de entrega en la referencia. Se cierra el RPC heredado para
-- que clientes autenticados no puedan invocarlo directamente y el acceso a
-- credenciales continúe limitado a get_business_order_credentials().
REVOKE EXECUTE ON FUNCTION public.get_business_orders(
  text, text, text, integer, integer, text, integer, integer
) FROM authenticated;
