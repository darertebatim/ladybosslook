ALTER TABLE public.aperture_onboarding_questions
  ADD COLUMN IF NOT EXISTS bucket_question_keys text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.aperture_onboarding_questions.bucket_question_keys IS
  'Per-bucket question_key values this onboarding answer satisfies. When an answer is saved, a memory_item is written for each (bucket_slug, bucket_question_key) pair so bucket questions are ticked off and never re-asked.';