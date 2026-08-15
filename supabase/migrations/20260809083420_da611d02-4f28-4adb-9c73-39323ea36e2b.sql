CREATE TABLE public.admin_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

GRANT SELECT ON public.admin_status TO anon;
GRANT SELECT ON public.admin_status TO authenticated;
GRANT ALL ON public.admin_status TO service_role;
GRANT UPDATE ON public.admin_status TO authenticated;

ALTER TABLE public.admin_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read status" ON public.admin_status FOR SELECT USING (true);
CREATE POLICY "Admins can update status" ON public.admin_status FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_status (is_active) VALUES (true);