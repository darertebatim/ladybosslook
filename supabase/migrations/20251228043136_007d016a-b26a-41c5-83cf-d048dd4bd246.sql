-- Add mailchimp_tags column to program_rounds for round-specific tags
ALTER TABLE public.program_rounds 
ADD COLUMN mailchimp_tags jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.program_rounds.mailchimp_tags IS 'Mailchimp tags specific to this round';