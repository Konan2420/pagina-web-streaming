-- Configuración singleton del banner de descuento para el flujo de recargas.
CREATE TABLE IF NOT EXISTS public.discount_banner_config (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  is_active boolean NOT NULL DEFAULT false,
  discount_amount integer NOT NULL DEFAULT 10 CHECK (discount_amount BETWEEN 0 AND 100),
  main_text text NOT NULL DEFAULT '{user} descuento del {amount}%!',
  sub_text text NOT NULL DEFAULT 'En tu próxima recarga',
  icon_type text NOT NULL DEFAULT 'emoji' CHECK (icon_type IN ('emoji', 'image')),
  icon_value text NOT NULL DEFAULT '🎁',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discount_banner_config_valid_period CHECK (ends_at IS NULL OR ends_at > starts_at)
);

INSERT INTO public.discount_banner_config (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_discount_banner_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS discount_banner_config_updated_at ON public.discount_banner_config;
CREATE TRIGGER discount_banner_config_updated_at
BEFORE UPDATE ON public.discount_banner_config
FOR EACH ROW EXECUTE FUNCTION public.set_discount_banner_config_updated_at();

ALTER TABLE public.discount_banner_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read discount banner" ON public.discount_banner_config;
CREATE POLICY "Authenticated users read discount banner"
ON public.discount_banner_config
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage discount banner" ON public.discount_banner_config;
CREATE POLICY "Admins manage discount banner"
ON public.discount_banner_config
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.discount_banner_config FROM anon;
GRANT SELECT ON public.discount_banner_config TO authenticated;
GRANT ALL ON public.discount_banner_config TO service_role;

-- Auditoría de la bonificación aplicada cuando un proveedor o distribuidor recarga saldo.
ALTER TABLE public.recargas
  ADD COLUMN IF NOT EXISTS descuento_aplicado_porcentaje numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bono_credito_pen numeric(12,2) NOT NULL DEFAULT 0;

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
  banner public.discount_banner_config%ROWTYPE;
  percentage_applied numeric(5,2) := 0;
  bonus_amount numeric(12,2) := 0;
  total_credit numeric(12,2);
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

  -- La elegibilidad se determina por quien solicitó la recarga, no por datos
  -- enviados desde el navegador. El crédito llega al beneficiario validado.
  SELECT *
  INTO banner
  FROM public.discount_banner_config
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
    AND is_active
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  FOR SHARE;

  IF banner.id IS NOT NULL
    AND banner.discount_amount > 0
    AND EXISTS (
      SELECT 1
      FROM public.user_roles roles
      WHERE roles.user_id = recharge.user_id
        AND roles.role::text IN ('proveedor', 'distribuidor')
    ) THEN
    percentage_applied := banner.discount_amount;
    bonus_amount := round(_monto_acreditado_pen * percentage_applied / 100, 2);
  END IF;

  total_credit := round(_monto_acreditado_pen + bonus_amount, 2);

  INSERT INTO public.wallet_balances (user_id, saldo_pen, updated_at)
  VALUES (recharge.beneficiario_id, total_credit, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    saldo_pen = public.wallet_balances.saldo_pen + EXCLUDED.saldo_pen,
    updated_at = now();

  UPDATE public.recargas
  SET estado = 'verificado'::public.recarga_status,
      monto_acreditado_pen = total_credit,
      descuento_aplicado_porcentaje = percentage_applied,
      bono_credito_pen = bonus_amount,
      motivo_rechazo = NULL,
      verificado_por = auth.uid(),
      verificado_at = now(),
      updated_at = now()
  WHERE id = recharge.id
  RETURNING * INTO recharge;

  RETURN recharge;
END;
$$;

-- Bucket público para imágenes opcionales del banner. Solo administradores pueden escribir.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'discount-banner-assets',
  'discount-banner-assets',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read discount banner assets" ON storage.objects;
CREATE POLICY "Public read discount banner assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'discount-banner-assets');

DROP POLICY IF EXISTS "Admins upload discount banner assets" ON storage.objects;
CREATE POLICY "Admins upload discount banner assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'discount-banner-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins update discount banner assets" ON storage.objects;
CREATE POLICY "Admins update discount banner assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'discount-banner-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'discount-banner-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Admins delete discount banner assets" ON storage.objects;
CREATE POLICY "Admins delete discount banner assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'discount-banner-assets'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

COMMENT ON TABLE public.discount_banner_config IS
  'Configuración singleton del banner de descuentos mostrado en recargas.';
