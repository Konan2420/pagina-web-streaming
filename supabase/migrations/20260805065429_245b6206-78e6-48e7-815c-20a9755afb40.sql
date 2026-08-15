CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payout_caseid TEXT UNIQUE,
  entity TEXT NOT NULL,
  account TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  document_type TEXT,
  document TEXT,
  first_name TEXT,
  father_lastname TEXT,
  mother_lastname TEXT,
  currency TEXT NOT NULL DEFAULT 'PEN',
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  message TEXT,
  error_message TEXT,
  transaction_id TEXT,
  sandbox BOOLEAN NOT NULL DEFAULT true,
  custom JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_response JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payouts"
  ON public.payouts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER payouts_set_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX payouts_created_at_idx ON public.payouts (created_at DESC);
CREATE INDEX payouts_status_idx ON public.payouts (status);