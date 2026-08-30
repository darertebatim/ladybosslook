ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.form_submissions.meta IS 'Flexible metadata such as original_email for additional addresses or campaign tags';