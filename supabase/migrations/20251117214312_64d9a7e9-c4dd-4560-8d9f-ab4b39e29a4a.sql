-- Add field to control if program is free on iOS
ALTER TABLE program_catalog
ADD COLUMN is_free_on_ios boolean DEFAULT false;

COMMENT ON COLUMN program_catalog.is_free_on_ios IS 'If true, this program is offered for free on iOS app (for App Store compliance)';
