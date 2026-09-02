-- Billetera y recargas manuales. No integra APIs de pago: todas las aprobaciones
-- pasan por una verificación administrativa y una función atómica.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'recarga_method' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.recarga_method AS ENUM ('lemon_cash', 'yape_plin', 'binance');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'recarga_currency' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.recarga_currency AS ENUM ('PEN', 'USD');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'recarga_status' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.recarga_status AS ENUM ('pendiente', 'verificado', 'rechazado');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_balances (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  saldo_pen numeric(12,2) NOT NULL DEFAULT 0 CHECK (saldo_pen >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  lemon_qr_url text,
  lemon_tag text,
  yape_plin_contact text,
  binance_pay_id text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.recargas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  beneficiario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  beneficiario_email text,
  para_otro_usuario boolean NOT NULL DEFAULT false,
  metodo public.recarga_method NOT NULL,
  monto numeric(12,2) NOT NULL CHECK (monto > 0),
  moneda public.recarga_currency NOT NULL,
  nombre_declarado text NOT NULL CHECK (char_length(btrim(nombre_declarado)) BETWEEN 2 AND 120),
  monto_acreditado_pen numeric(12,2) CHECK (monto_acreditado_pen IS NULL OR monto_acreditado_pen > 0),
  estado public.recarga_status NOT NULL DEFAULT 'pendiente',
  motivo_rechazo text,
  verificado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verificado_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recargas_user_created_idx
  ON public.recargas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recargas_beneficiario_created_idx
  ON public.recargas(beneficiario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recargas_status_created_idx
  ON public.recargas(estado, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_wallet_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_recarga()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  resolved_beneficiary uuid;
BEGIN
  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Recharge requester must match the authenticated user';
  END IF;

  NEW.estado = 'pendiente'::public.recarga_status;
  NEW.monto_acreditado_pen = NULL;
  NEW.motivo_rechazo = NULL;
  NEW.verificado_por = NULL;
  NEW.verificado_at = NULL;

  IF NOT NEW.para_otro_usuario THEN
    NEW.beneficiario_id = auth.uid();
    NEW.beneficiario_email = NULL;
    RETURN NEW;
  END IF;

  IF NULLIF(btrim(COALESCE(NEW.beneficiario_email, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Recipient email is required for third-party recharges';
  END IF;

  SELECT p.id
  INTO resolved_beneficiary
  FROM public.profiles p
  WHERE lower(COALESCE(p.email, '')) = lower(btrim(NEW.beneficiario_email))
  LIMIT 1;

  IF resolved_beneficiary IS NULL THEN
    RAISE EXCEPTION 'The recipient must have a CMD Streaming account';
  END IF;

  NEW.beneficiario_id = resolved_beneficiary;
  NEW.beneficiario_email = lower(btrim(NEW.beneficiario_email));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_recarga(
  _recarga_id uuid,
  _monto_acreditado_pen numeric
)
RETURNS public.recargas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recharge public.recargas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _monto_acreditado_pen IS NULL OR _monto_acreditado_pen <= 0 THEN
    RAISE EXCEPTION 'A positive PEN credit amount is required';
  END IF;

  SELECT *
  INTO recharge
  FROM public.recargas
  WHERE id = _recarga_id
  FOR UPDATE;

  IF recharge.id IS NULL THEN
    RAISE EXCEPTION 'Recharge not found';
  END IF;

  IF recharge.estado <> 'pendiente'::public.recarga_status THEN
    RAISE EXCEPTION 'Recharge has already been processed';
  END IF;

  IF recharge.beneficiario_id IS NULL THEN
    RAISE EXCEPTION 'Recharge recipient is not valid';
  END IF;

  INSERT INTO public.wallet_balances (user_id, saldo_pen, updated_at)
  VALUES (recharge.beneficiario_id, _monto_acreditado_pen, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    saldo_pen = public.wallet_balances.saldo_pen + EXCLUDED.saldo_pen,
    updated_at = now();

  UPDATE public.recargas
  SET estado = 'verificado'::public.recarga_status,
      monto_acreditado_pen = _monto_acreditado_pen,
      motivo_rechazo = NULL,
      verificado_por = auth.uid(),
      verificado_at = now(),
      updated_at = now()
  WHERE id = recharge.id
  RETURNING * INTO recharge;

  RETURN recharge;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_recarga(
  _recarga_id uuid,
  _motivo text DEFAULT NULL
)
RETURNS public.recargas
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  recharge public.recargas%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO recharge
  FROM public.recargas
  WHERE id = _recarga_id
  FOR UPDATE;

  IF recharge.id IS NULL THEN
    RAISE EXCEPTION 'Recharge not found';
  END IF;

  IF recharge.estado <> 'pendiente'::public.recarga_status THEN
    RAISE EXCEPTION 'Recharge has already been processed';
  END IF;

  UPDATE public.recargas
  SET estado = 'rechazado'::public.recarga_status,
      motivo_rechazo = NULLIF(btrim(COALESCE(_motivo, '')), ''),
      verificado_por = auth.uid(),
      verificado_at = now(),
      updated_at = now()
  WHERE id = recharge.id
  RETURNING * INTO recharge;

  RETURN recharge;
END;
$$;

DROP TRIGGER IF EXISTS wallet_balances_set_updated_at ON public.wallet_balances;
CREATE TRIGGER wallet_balances_set_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

DROP TRIGGER IF EXISTS payment_settings_set_updated_at ON public.payment_settings;
CREATE TRIGGER payment_settings_set_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

DROP TRIGGER IF EXISTS recargas_prepare_insert ON public.recargas;
CREATE TRIGGER recargas_prepare_insert
  BEFORE INSERT ON public.recargas
  FOR EACH ROW EXECUTE FUNCTION public.prepare_recarga();

DROP TRIGGER IF EXISTS recargas_set_updated_at ON public.recargas;
CREATE TRIGGER recargas_set_updated_at
  BEFORE UPDATE ON public.recargas
  FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recargas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own wallet balance" ON public.wallet_balances;
DROP POLICY IF EXISTS "Admins can read all wallet balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Admins can manage wallet balances" ON public.wallet_balances;

CREATE POLICY "Users can read their own wallet balance"
ON public.wallet_balances FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all wallet balances"
ON public.wallet_balances FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage wallet balances"
ON public.wallet_balances FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can read payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Admins can manage payment settings" ON public.payment_settings;

CREATE POLICY "Authenticated users can read payment settings"
ON public.payment_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage payment settings"
ON public.payment_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read their own recharge activity" ON public.recargas;
DROP POLICY IF EXISTS "Users can create their own recharge requests" ON public.recargas;
DROP POLICY IF EXISTS "Admins can manage all recharges" ON public.recargas;

CREATE POLICY "Users can read their own recharge activity"
ON public.recargas FOR SELECT TO authenticated
USING (auth.uid() = user_id OR auth.uid() = beneficiario_id);

CREATE POLICY "Users can create their own recharge requests"
ON public.recargas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND estado = 'pendiente'::public.recarga_status);

CREATE POLICY "Admins can manage all recharges"
ON public.recargas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.wallet_balances, public.payment_settings, public.recargas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_balances, public.payment_settings, public.recargas TO authenticated;
GRANT ALL ON public.wallet_balances, public.payment_settings, public.recargas TO service_role;

REVOKE ALL ON FUNCTION public.set_wallet_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_recarga() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_recarga(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_recarga(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_recarga(uuid, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_recarga(uuid, text) TO authenticated, service_role;
