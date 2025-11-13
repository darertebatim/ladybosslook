-- Add stripe_payment_link column to program_catalog
ALTER TABLE program_catalog 
ADD COLUMN IF NOT EXISTS stripe_payment_link text;

COMMENT ON COLUMN program_catalog.stripe_payment_link IS 'Stripe Payment Link URL for this specific program with its exact price';
