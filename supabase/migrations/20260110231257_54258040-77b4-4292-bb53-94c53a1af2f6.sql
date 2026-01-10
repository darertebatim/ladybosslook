-- Add drip_offset_days column to program_rounds
-- Positive values = freeze/delay all tracks
-- Negative values = release earlier
ALTER TABLE program_rounds 
ADD COLUMN drip_offset_days integer NOT NULL DEFAULT 0;

-- Add comment explaining the field
COMMENT ON COLUMN program_rounds.drip_offset_days IS 
  'Offset in days for drip content. Positive = freeze/delay all tracks. Negative = release earlier.';