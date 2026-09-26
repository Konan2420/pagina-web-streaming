-- El proyecto ya tiene configurado ADMIN_PUSH_WEBHOOK_SECRET para el webhook
-- móvil. Reutilizarlo para Telegram evita duplicar secretos y garantiza que la
-- base de datos y ambas Edge Functions compartan exactamente el mismo valor.

CREATE OR REPLACE FUNCTION private.dispatch_admin_telegram_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, vault, net, pg_temp
AS $$
DECLARE
  webhook_secret text;
  delivery_id uuid;
BEGIN
  IF NEW.event_type NOT IN (
    'user_registered', 'recharge_pending', 'recharge_verified',
    'provider_recharge', 'distributor_recharge', 'order_completed',
    'business_sale', 'distributor_sale'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notification_deliveries (event_id, channel)
  VALUES (NEW.id, 'telegram')
  ON CONFLICT (event_id, channel) DO NOTHING
  RETURNING id INTO delivery_id;
  IF delivery_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
  INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'admin_push_webhook_secret'
  LIMIT 1;

  IF webhook_secret IS NULL THEN
    UPDATE public.admin_notification_deliveries
    SET status = 'failed', last_error = 'Telegram webhook secret unavailable'
    WHERE id = delivery_id;
    RAISE WARNING 'CMD Telegram dispatch skipped: webhook secret unavailable.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://jxxamracsyapozcepcgb.supabase.co/functions/v1/send-telegram-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-admin-telegram-secret', webhook_secret
    ),
    body := jsonb_build_object('record', jsonb_build_object('id', NEW.id)),
    timeout_milliseconds := 1500
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'CMD Telegram dispatch failed for event %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_admin_telegram_event() FROM PUBLIC;
