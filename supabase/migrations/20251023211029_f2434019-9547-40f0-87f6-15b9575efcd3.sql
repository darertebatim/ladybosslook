-- Add important message field to program rounds
ALTER TABLE program_rounds 
ADD COLUMN important_message text;