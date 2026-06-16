
ALTER TABLE public.aperture_tools
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industries text[] NOT NULL DEFAULT '{}';

UPDATE public.aperture_tools
SET categories = ARRAY[category]
WHERE (categories IS NULL OR cardinality(categories) = 0)
  AND category IS NOT NULL;
