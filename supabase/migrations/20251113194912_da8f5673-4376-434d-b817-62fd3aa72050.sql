-- Add IAP-related columns to program_catalog
ALTER TABLE program_catalog 
  ADD COLUMN available_on_web BOOLEAN DEFAULT true,
  ADD COLUMN available_on_mobile BOOLEAN DEFAULT true,
  ADD COLUMN ios_product_id TEXT,
  ADD COLUMN android_product_id TEXT;

-- Create index for querying by platform availability
CREATE INDEX idx_program_web_mobile ON program_catalog(available_on_web, available_on_mobile) 
  WHERE is_active = true;

-- Add comments for clarity
COMMENT ON COLUMN program_catalog.available_on_web IS 'If true, show program on web with Stripe payment';
COMMENT ON COLUMN program_catalog.available_on_mobile IS 'If true, show program on mobile with IAP';
COMMENT ON COLUMN program_catalog.ios_product_id IS 'Apple App Store product ID (e.g., com.ladybosslook.audiobook.cca)';
COMMENT ON COLUMN program_catalog.android_product_id IS 'Google Play product ID (e.g., cca_audiobook)';