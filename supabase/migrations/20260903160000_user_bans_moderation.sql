-- Sistema central de moderación y bloqueo de cuentas.
-- La cuenta (auth.users.id) es la fuente de verdad; la IP solo añade una
-- capa secundaria de prevención para login/registro y accesos autenticados.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'ban_status'
  ) THEN
    CREATE TYPE public.ban_status AS ENUM ('active', 'expired', 'revoked');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  ip_address inet,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status public.ban_status NOT NULL DEFAULT 'active',
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_bans_valid_period CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT user_bans_revocation_consistency CHECK (
    (status <> 'revoked') OR revoked_at IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS public.banned_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  banned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source_user_ban_id uuid REFERENCES public.user_bans(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status public.ban_status NOT NULL DEFAULT 'active',
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT banned_ips_valid_period CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT banned_ips_revocation_consistency CHECK (
    (status <> 'revoked') OR revoked_at IS NOT NULL
  )
);

-- Conserva la última IP vista por cuenta. Sirve exclusivamente para que un
-- administrador pueda añadir la IP conocida al baneo de una cuenta.
CREATE TABLE IF NOT EXISTS public.user_access_ips (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS user_bans_active_user_idx
  ON public.user_bans (user_id, starts_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS banned_ips_active_ip_idx
  ON public.banned_ips (ip_address, starts_at DESC)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS user_access_ips_last_seen_idx
  ON public.user_access_ips (user_id, last_seen_at DESC);

CREATE OR REPLACE FUNCTION public.set_ban_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_bans_updated_at ON public.user_bans;
CREATE TRIGGER set_user_bans_updated_at
  BEFORE UPDATE ON public.user_bans
  FOR EACH ROW EXECUTE FUNCTION public.set_ban_updated_at();

DROP TRIGGER IF EXISTS set_banned_ips_updated_at ON public.banned_ips;
CREATE TRIGGER set_banned_ips_updated_at
  BEFORE UPDATE ON public.banned_ips
  FOR EACH ROW EXECUTE FUNCTION public.set_ban_updated_at();

-- La reconciliación se ejecuta desde las operaciones de lectura/escritura del
-- backend. El chequeo de acceso además calcula el estado contra now(), por lo
-- que no depende de un cron para bloquear o liberar una cuenta a tiempo.
CREATE OR REPLACE FUNCTION public.reconcile_ban_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.user_bans
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();

  UPDATE public.banned_ips
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_bans ban
    WHERE ban.user_id = _user_id
      AND ban.status = 'active'
      AND ban.starts_at <= now()
      AND (ban.ends_at IS NULL OR ban.ends_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.is_ip_banned(_ip inet)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _ip IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.banned_ips ban
    WHERE ban.ip_address = _ip
      AND ban.status = 'active'
      AND ban.starts_at <= now()
      AND (ban.ends_at IS NULL OR ban.ends_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_banned()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT auth.uid() IS NOT NULL AND public.is_user_banned(auth.uid())
$$;

-- Una función de rol nunca concede privilegios a una cuenta suspendida. Esto
-- endurece en bloque las políticas existentes que ya usan public.has_role().
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$
  SELECT NOT public.is_user_banned(_user_id)
    AND private.has_role(_user_id, _role)
$$;

REVOKE ALL ON FUNCTION public.set_ban_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reconcile_ban_statuses() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_user_banned(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_ip_banned(inet) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_current_user_banned() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_banned() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_ip_banned(inet) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_ban_statuses() TO service_role;

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage user bans"
ON public.user_bans FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage banned IPs"
ON public.banned_ips FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins read account IP history"
ON public.user_access_ips FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON public.user_bans, public.banned_ips, public.user_access_ips FROM anon, authenticated;
GRANT ALL ON public.user_bans, public.banned_ips, public.user_access_ips TO service_role;

-- Las políticas de identidad usan auth.uid() directamente y por eso no pasan
-- por has_role(). Se endurecen explícitamente para que un JWT aún vigente no
-- pueda leer ni editar el perfil/roles propios mientras esté suspendido.
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Active users can read their own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id AND NOT public.is_current_user_banned());

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Active users can read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id AND NOT public.is_current_user_banned());

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Active users can create their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND NOT public.is_current_user_banned());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Active users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id AND NOT public.is_current_user_banned())
WITH CHECK (auth.uid() = id AND NOT public.is_current_user_banned());

COMMENT ON TABLE public.user_bans IS 'Auditable account suspensions. user_id is the primary enforcement key.';
COMMENT ON TABLE public.banned_ips IS 'Secondary IP-based access prevention; never the sole account-ban mechanism.';
COMMENT ON TABLE public.user_access_ips IS 'Last known authenticated request IPs, retained for moderation only.';
