ALTER TABLE public.promo_banners DROP CONSTRAINT IF EXISTS promo_banners_display_frequency_check;

ALTER TABLE public.promo_banners ADD CONSTRAINT promo_banners_display_frequency_check 
CHECK (display_frequency IN ('once', 'daily', 'always', 'forever'));