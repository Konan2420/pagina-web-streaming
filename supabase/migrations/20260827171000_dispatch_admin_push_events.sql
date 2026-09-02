-- Deliver admin_event_log inserts to the Edge Function without storing a
-- webhook secret in source control. The shared secret is generated once and
-- encrypted in Supabase Vault.

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM vault.secrets
    WHERE name = 'admin_push_webhook_secret'
  ) THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'admin_push_webhook_secret',
      'Authenticates public.admin_event_log database webhooks to the CMD admin push Edge Function.'
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION private.dispatch_admin_push_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, vault, net, pg_temp
AS $$
DECLARE
  webhook_secret text;
BEGIN
  SELECT decrypted_secret
  INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'admin_push_webhook_secret'
  LIMIT 1;

  -- A push delivery failure must never block a recharge, order or inventory
  -- transaction. It is observable as a PostgreSQL warning and can be retried
  -- from the event log without compromising the marketplace transaction.
  IF webhook_secret IS NULL THEN
    RAISE WARNING 'CMD admin push dispatch skipped: webhook secret is unavailable.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://jxxamracsyapozcepcgb.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-push-secret', webhook_secret
    ),
    body := jsonb_build_object('record', jsonb_build_object('id', NEW.id)),
    timeout_milliseconds := 1500
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'CMD admin push dispatch failed for event %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_admin_push_event() FROM PUBLIC;

DROP TRIGGER IF EXISTS admin_event_log_dispatch_push ON public.admin_event_log;
CREATE TRIGGER admin_event_log_dispatch_push
  AFTER INSERT ON public.admin_event_log
  FOR EACH ROW
  EXECUTE FUNCTION private.dispatch_admin_push_event();
