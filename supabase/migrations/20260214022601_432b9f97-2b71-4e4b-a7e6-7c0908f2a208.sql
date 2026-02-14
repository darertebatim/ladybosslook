
-- Update type check constraint to include 'subscription'
ALTER TABLE public.program_catalog DROP CONSTRAINT program_catalog_type_check;
ALTER TABLE public.program_catalog ADD CONSTRAINT program_catalog_type_check 
  CHECK (type = ANY (ARRAY['course','group-coaching','1o1-session','webinar','event','audiobook','meditate','workout','soundscape','affirmations','subscription']));

-- Add trial_days column to program_catalog
ALTER TABLE public.program_catalog ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
