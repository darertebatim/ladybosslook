-- Fix partial unique index so PostgREST upserts on (user_id, bucket_slug, question_key) work
DROP INDEX IF EXISTS public.aperture_memory_items_user_q_unique;
-- Need NOT NULL bucket_slug for unique to behave consistently; use COALESCE trick via expression index
CREATE UNIQUE INDEX aperture_memory_items_user_q_unique
  ON public.aperture_memory_items (user_id, COALESCE(bucket_slug, ''), COALESCE(question_key, ''))
  WHERE question_key IS NOT NULL;

-- Drop overlapping full-flow questions that are already covered by Quick onboarding
UPDATE public.aperture_onboarding_questions
SET is_active = false
WHERE flow = 'full'
  AND question_key IN (
    'full_q2_how_long',     -- covered by quick how-long-running
    'full_q3_people',       -- covered by quick team-size
    'full_q16_team',        -- duplicate of team-size
    'full_q5_revenue',      -- covered by quick revenue
    'full_q31_same_revenue',-- covered by quick revenue
    'full_q8_revenue_source',-- covered by quick revenue-mix
    'full_q26_stuck',       -- covered by quick stuck
    'full_q27_question'     -- covered by quick stuck (closing)
  );