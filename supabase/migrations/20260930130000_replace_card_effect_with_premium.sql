-- Sustituye el selector genérico de efecto por una marca Premium y una variante
-- visual explícita. Los productos que usaban el efecto eléctrico anterior se
-- conservan como Premium morado antes de retirar la columna obsoleta.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_style text NOT NULL DEFAULT 'purple';

UPDATE public.products
SET is_premium = true,
    premium_style = 'purple'
WHERE card_effect = 'electric';

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_premium_style_check,
  ADD CONSTRAINT products_premium_style_check
    CHECK (premium_style IN ('purple', 'blue', 'gold'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_card_effect_check,
  DROP COLUMN IF EXISTS card_effect;

COMMENT ON COLUMN public.products.is_premium IS
  'Indica si la tarjeta del catálogo utiliza el sistema CMD Premium Electric.';
COMMENT ON COLUMN public.products.premium_style IS
  'Variante visual Premium: purple, blue o gold.';
