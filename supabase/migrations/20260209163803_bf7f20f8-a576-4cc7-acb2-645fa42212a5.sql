
-- Add is_self_paced flag to program_rounds
ALTER TABLE public.program_rounds
ADD COLUMN is_self_paced boolean NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.program_rounds.is_self_paced IS 'When true, drip content dates are relative to each user''s enrollment date instead of the round first_session_date';
