-- Add Stripe product and price ID columns to program_catalog
-- These will store reusable Stripe IDs to prevent duplicate product creation

ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS stripe_product_id text,
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add comments for documentation
COMMENT ON COLUMN public.program_catalog.stripe_product_id IS 'Reusable Stripe product ID (prod_xxx) for one-time payments';
COMMENT ON COLUMN public.program_catalog.stripe_price_id IS 'Reusable Stripe price ID (price_xxx) for subscription payments';