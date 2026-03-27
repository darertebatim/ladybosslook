ALTER TABLE public.home_banners
  ADD COLUMN IF NOT EXISTS target_languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_timezones text[] DEFAULT '{}';