-- Add deposit_price column to program_catalog table
ALTER TABLE program_catalog 
ADD COLUMN deposit_price integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN program_catalog.deposit_price IS 'Optional deposit amount in cents. Used for landing pages that charge a deposit instead of full price.';