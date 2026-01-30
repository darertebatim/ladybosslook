-- Drop the old constraint and add a new one with all destination types
ALTER TABLE public.promo_banners
DROP CONSTRAINT IF EXISTS promo_banners_destination_type_check;

ALTER TABLE public.promo_banners
ADD CONSTRAINT promo_banners_destination_type_check
CHECK (destination_type IN ('routine', 'playlist', 'journal', 'programs', 'breathe', 'water', 'channels', 'home', 'inspire', 'custom_url'));