ALTER TABLE public.user_routines_bank
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS is_focus boolean DEFAULT false;