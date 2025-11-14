-- Add Mailchimp configuration fields to program_catalog
ALTER TABLE program_catalog 
ADD COLUMN mailchimp_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN mailchimp_program_name TEXT;