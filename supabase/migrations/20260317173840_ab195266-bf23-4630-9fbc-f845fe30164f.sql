-- Add completed_at to track when a project routine is fully completed
ALTER TABLE public.user_routines_bank
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;