ALTER TABLE public.breathing_exercises DROP CONSTRAINT IF EXISTS breathing_exercises_category_check;
ALTER TABLE public.breathing_exercises ADD CONSTRAINT breathing_exercises_category_check
  CHECK (category = ANY (ARRAY['morning'::text, 'energize'::text, 'focus'::text, 'calm'::text, 'night'::text, 'emotion-based'::text]));