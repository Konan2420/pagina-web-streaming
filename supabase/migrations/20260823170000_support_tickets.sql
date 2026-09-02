-- Sistema de soporte por tickets para CMD Streaming.
-- Los roles de cada respuesta se determinan en base a public.has_role(), nunca desde el cliente.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ticket_category' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.ticket_category AS ENUM ('pago', 'producto_cuenta', 'cuenta_usuario', 'otro');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ticket_status' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.ticket_status AS ENUM ('abierto', 'respondido', 'cerrado');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ticket_author' AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.ticket_author AS ENUM ('usuario', 'admin');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asunto text NOT NULL CHECK (char_length(btrim(asunto)) BETWEEN 3 AND 140),
  categoria public.ticket_category NOT NULL,
  descripcion text NOT NULL CHECK (char_length(btrim(descripcion)) BETWEEN 10 AND 3000),
  estado public.ticket_status NOT NULL DEFAULT 'abierto',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  autor public.ticket_author NOT NULL DEFAULT 'usuario',
  mensaje text NOT NULL CHECK (char_length(btrim(mensaje)) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_user_created_idx
  ON public.tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_status_category_created_idx
  ON public.tickets(estado, categoria, created_at DESC);
CREATE INDEX IF NOT EXISTS ticket_respuestas_ticket_created_idx
  ON public.ticket_respuestas(ticket_id, created_at ASC);

CREATE OR REPLACE FUNCTION public.set_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ticket_reply_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.author_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Ticket reply author must match the authenticated user';
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    NEW.autor = 'admin';
  ELSE
    NEW.autor = 'usuario';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_ticket_after_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.tickets
  SET estado = CASE
      WHEN NEW.autor = 'admin' THEN 'respondido'::public.ticket_status
      WHEN estado <> 'cerrado'::public.ticket_status THEN 'abierto'::public.ticket_status
      ELSE estado
    END,
    updated_at = now()
  WHERE id = NEW.ticket_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_set_updated_at ON public.tickets;
CREATE TRIGGER tickets_set_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_updated_at();

DROP TRIGGER IF EXISTS ticket_respuestas_set_author ON public.ticket_respuestas;
CREATE TRIGGER ticket_respuestas_set_author
  BEFORE INSERT ON public.ticket_respuestas
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_reply_author();

DROP TRIGGER IF EXISTS ticket_respuestas_sync_ticket ON public.ticket_respuestas;
CREATE TRIGGER ticket_respuestas_sync_ticket
  AFTER INSERT ON public.ticket_respuestas
  FOR EACH ROW EXECUTE FUNCTION public.sync_ticket_after_reply();

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_respuestas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets;

CREATE POLICY "Users can read their own tickets"
ON public.tickets FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.tickets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND estado = 'abierto'::public.ticket_status);

CREATE POLICY "Admins can manage all tickets"
ON public.tickets FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can read replies on their tickets" ON public.ticket_respuestas;
DROP POLICY IF EXISTS "Users can reply to their open tickets" ON public.ticket_respuestas;
DROP POLICY IF EXISTS "Admins can manage all ticket replies" ON public.ticket_respuestas;

CREATE POLICY "Users can read replies on their tickets"
ON public.ticket_respuestas FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = ticket_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can reply to their open tickets"
ON public.ticket_respuestas FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1
      FROM public.tickets t
      WHERE t.id = ticket_id
        AND t.user_id = auth.uid()
        AND t.estado <> 'cerrado'::public.ticket_status
    )
  )
);

CREATE POLICY "Admins can manage all ticket replies"
ON public.ticket_respuestas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.tickets, public.ticket_respuestas FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets, public.ticket_respuestas TO authenticated;
GRANT ALL ON public.tickets, public.ticket_respuestas TO service_role;

REVOKE ALL ON FUNCTION public.set_ticket_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_ticket_reply_author() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_ticket_after_reply() FROM PUBLIC, anon, authenticated;
