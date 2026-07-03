
ALTER TABLE public.aperture_memory_items
  ADD COLUMN IF NOT EXISTS source_kind text,
  ADD COLUMN IF NOT EXISTS locked_from_refetch boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS aperture_memory_items_source_kind_idx
  ON public.aperture_memory_items (user_id, source_kind)
  WHERE source_kind IS NOT NULL;

-- Backfill: existing website/instagram facts identified by question_key prefix.
UPDATE public.aperture_memory_items
   SET source_kind = 'website'
 WHERE source_kind IS NULL AND question_key LIKE 'website__%';

UPDATE public.aperture_memory_items
   SET source_kind = 'instagram'
 WHERE source_kind IS NULL AND question_key LIKE 'instagram__%';
