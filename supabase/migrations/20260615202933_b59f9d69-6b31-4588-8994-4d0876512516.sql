
ALTER TABLE public.aperture_buckets
  ADD COLUMN IF NOT EXISTS target_count integer NOT NULL DEFAULT 8;
