-- Expand allowed program_catalog.type values to support playlist-derived program types
ALTER TABLE public.program_catalog
  DROP CONSTRAINT IF EXISTS program_catalog_type_check;

ALTER TABLE public.program_catalog
  ADD CONSTRAINT program_catalog_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'course'::text,
        'group-coaching'::text,
        '1o1-session'::text,
        'webinar'::text,
        'event'::text,
        'audiobook'::text,
        'meditate'::text,
        'workout'::text,
        'soundscape'::text,
        'affirmations'::text
      ]
    )
  );