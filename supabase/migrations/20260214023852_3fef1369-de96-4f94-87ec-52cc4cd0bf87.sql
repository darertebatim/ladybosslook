
-- Add annual pricing fields to program_catalog
ALTER TABLE public.program_catalog 
  ADD COLUMN IF NOT EXISTS annual_price_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS annual_ios_product_id TEXT,
  ADD COLUMN IF NOT EXISTS annual_android_product_id TEXT;
