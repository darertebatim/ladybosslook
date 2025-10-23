-- Add new columns to program_catalog for enhanced program details
ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS original_price integer,
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS delivery_method text CHECK (delivery_method IN ('live-online', 'on-demand')),
ADD COLUMN IF NOT EXISTS subscription_full_payment_discount integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.program_catalog.original_price IS 'Original price in cents before discount';
COMMENT ON COLUMN public.program_catalog.price_amount IS 'Current sale price in cents';
COMMENT ON COLUMN public.program_catalog.duration IS 'Program duration (e.g., "6 weeks", "3 months", "Self-paced")';
COMMENT ON COLUMN public.program_catalog.delivery_method IS 'Live Online Course or On-Demand Course';
COMMENT ON COLUMN public.program_catalog.subscription_full_payment_discount IS 'Discount amount in cents for paying subscription in full';