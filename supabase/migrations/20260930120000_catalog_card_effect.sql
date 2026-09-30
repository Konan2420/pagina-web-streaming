-- Efecto visual configurable por producto del catálogo.
-- `none` mantiene el aspecto normal; los efectos futuros se añaden al mapa
-- central del frontend y a esta restricción cuando estén listos.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS card_effect text NOT NULL DEFAULT 'none';

UPDATE public.products
SET card_effect = 'none'
WHERE card_effect IS NULL OR card_effect = '';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_card_effect_check,
  ADD CONSTRAINT products_card_effect_check
    CHECK (card_effect IN ('none', 'electric'));

COMMENT ON COLUMN public.products.card_effect IS
  'Efecto visual asignado a la tarjeta del catálogo: none o electric.';
