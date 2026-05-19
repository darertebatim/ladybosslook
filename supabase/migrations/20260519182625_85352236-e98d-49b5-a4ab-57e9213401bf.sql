ALTER TABLE public.routines_bank ADD COLUMN IF NOT EXISTS is_challenge boolean NOT NULL DEFAULT false;
UPDATE public.routines_bank SET is_challenge = true WHERE schedule_type = 'challenge';
UPDATE public.routines_bank SET schedule_type = 'drip' WHERE schedule_type = 'challenge';