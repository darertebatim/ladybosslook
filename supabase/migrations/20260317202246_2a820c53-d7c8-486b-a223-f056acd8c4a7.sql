
-- Add is_focus column to routines_bank
ALTER TABLE public.routines_bank ADD COLUMN is_focus boolean NOT NULL DEFAULT false;

-- Set the 40 new routines as focus routines
UPDATE public.routines_bank SET is_focus = true WHERE sort_order >= 54 AND sort_order <= 93;
