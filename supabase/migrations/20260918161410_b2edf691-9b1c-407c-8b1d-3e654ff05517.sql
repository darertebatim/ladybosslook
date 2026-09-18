ALTER TABLE public.program_catalog
  ADD COLUMN IF NOT EXISTS deposit_stripe_price_id text,
  ADD COLUMN IF NOT EXISTS balance_full_stripe_price_id text,
  ADD COLUMN IF NOT EXISTS balance_monthly_stripe_price_id text;