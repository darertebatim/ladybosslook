ALTER TABLE public.aperture_messages
  ADD COLUMN IF NOT EXISTS is_memory_question boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bucket_slug text;