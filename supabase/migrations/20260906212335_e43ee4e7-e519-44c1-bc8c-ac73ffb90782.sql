ALTER TABLE public.learn_courses
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS intro_note text;

ALTER TABLE public.learn_modules
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

ALTER TABLE public.learn_lessons
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_free_preview boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS drip_days integer,
  ADD COLUMN IF NOT EXISTS drip_date timestamptz,
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;