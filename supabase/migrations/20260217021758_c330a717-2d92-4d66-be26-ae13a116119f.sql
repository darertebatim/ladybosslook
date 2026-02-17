-- Add is_free flag to routines_bank
ALTER TABLE public.routines_bank ADD COLUMN is_free boolean NOT NULL DEFAULT false;
