-- QR administrables para cada método de recarga.
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS yape_plin_qr_url text,
  ADD COLUMN IF NOT EXISTS binance_qr_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qr-codes',
  'payment-qr-codes',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can insert payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment QR codes" ON storage.objects;

CREATE POLICY "Public can read payment QR codes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-qr-codes');

CREATE POLICY "Admins can insert payment QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-qr-codes'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update payment QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'payment-qr-codes'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete payment QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-qr-codes'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
