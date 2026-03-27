ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS target_languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_timezones text[] DEFAULT '{}';