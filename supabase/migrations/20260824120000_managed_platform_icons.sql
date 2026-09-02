-- Convierte los servicios del panel admin en la fuente de íconos de la tienda.
ALTER TABLE public.servicios_streaming
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS service_id uuid
  REFERENCES public.servicios_streaming(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS products_service_id_idx
  ON public.products(service_id);

CREATE INDEX IF NOT EXISTS servicios_streaming_visible_order_idx
  ON public.servicios_streaming(is_visible, display_order, nombre);
