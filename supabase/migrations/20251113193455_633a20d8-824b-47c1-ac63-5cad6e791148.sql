-- Update the CHECK constraint on program_catalog.type to include 'audiobook'
ALTER TABLE program_catalog 
  DROP CONSTRAINT IF EXISTS program_catalog_type_check;

ALTER TABLE program_catalog 
  ADD CONSTRAINT program_catalog_type_check 
  CHECK (type IN ('course', 'group-coaching', '1o1-session', 'webinar', 'event', 'audiobook'));