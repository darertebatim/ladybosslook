ALTER TABLE public.learn_modules
  ADD COLUMN IF NOT EXISTS drip_days integer,
  ADD COLUMN IF NOT EXISTS drip_date date;