-- El porcentaje configurado en el banner aumenta el saldo de cualquier cliente
-- autenticado que realice una recarga; no depende del rol del solicitante.
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

  SELECT *
  INTO banner
  FROM public.discount_banner_config
  WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
    AND is_active
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
  FOR SHARE;

  IF banner.id IS NOT NULL AND banner.discount_amount > 0 THEN
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

COMMENT ON FUNCTION public.approve_recarga(uuid, numeric) IS
  'Aprueba una recarga y suma el porcentaje vigente del banner a cualquier cliente.';
