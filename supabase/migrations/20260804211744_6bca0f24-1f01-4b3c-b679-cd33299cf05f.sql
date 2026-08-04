ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS round_id uuid,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_round_id uuid;

UPDATE public.form_submissions
SET round_id = CASE WHEN submitted_at < '2026-08-04 21:07:11+00'
  THEN 'f267cca0-e749-4287-a05d-c81a03dff8e2'::uuid
  ELSE '05ffc800-f8c6-43e2-8147-4fbc87908ac5'::uuid END
WHERE source IN ('sixtraps_registration','presixtraps_interest') AND round_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_round ON public.form_submissions(round_id);