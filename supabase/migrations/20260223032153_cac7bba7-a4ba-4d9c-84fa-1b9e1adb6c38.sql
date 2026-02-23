-- Drop existing default first
ALTER TABLE public.promo_banners ALTER COLUMN display_location DROP DEFAULT;

-- Convert display_location from text to text[]
ALTER TABLE public.promo_banners 
ALTER COLUMN display_location TYPE text[] 
USING CASE 
  WHEN display_location IS NULL THEN ARRAY['home_top']::text[]
  ELSE ARRAY[display_location]::text[]
END;

-- Set new array default
ALTER TABLE public.promo_banners 
ALTER COLUMN display_location SET DEFAULT ARRAY['home_top']::text[];