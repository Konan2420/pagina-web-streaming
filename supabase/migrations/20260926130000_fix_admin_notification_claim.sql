-- Corrige la ambigüedad entre el parámetro de salida attempt_count y la
-- columna homónima de admin_notification_deliveries.

CREATE OR REPLACE FUNCTION public.claim_admin_notification_delivery(
  _event_id uuid,
  _channel text
)
RETURNS TABLE(delivery_id uuid, attempt_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  delivery public.admin_notification_deliveries%ROWTYPE;
  claimed_id uuid;
  claimed_attempt integer;
BEGIN
  IF _channel NOT IN ('telegram', 'web_push', 'email') THEN
    RAISE EXCEPTION 'Unsupported notification channel';
  END IF;

  INSERT INTO public.admin_notification_deliveries (event_id, channel)
  VALUES (_event_id, _channel)
  ON CONFLICT (event_id, channel) DO NOTHING;

  SELECT *
  INTO delivery
  FROM public.admin_notification_deliveries
  WHERE event_id = _event_id AND channel = _channel
  FOR UPDATE;

  IF delivery.status = 'sent'
    OR (delivery.status = 'sending' AND delivery.updated_at > now() - interval '5 minutes')
    OR delivery.attempt_count >= 10
  THEN
    RETURN;
  END IF;

  UPDATE public.admin_notification_deliveries AS queued_delivery
  SET status = 'sending',
      attempt_count = delivery.attempt_count + 1,
      last_error = NULL,
      next_retry_at = NULL
  WHERE queued_delivery.id = delivery.id
  RETURNING queued_delivery.id, queued_delivery.attempt_count
  INTO claimed_id, claimed_attempt;
  RETURN QUERY SELECT claimed_id, claimed_attempt;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_notification_delivery(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_notification_delivery(uuid, text) TO service_role;
