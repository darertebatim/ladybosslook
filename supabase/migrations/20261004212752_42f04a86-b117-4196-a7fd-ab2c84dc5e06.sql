ALTER TABLE public.program_catalog
  ADD COLUMN IF NOT EXISTS includes_one_on_one boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS one_on_one_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS booking_note text;