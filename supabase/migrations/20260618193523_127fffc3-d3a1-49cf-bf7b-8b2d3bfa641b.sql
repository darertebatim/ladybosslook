
ALTER TABLE public.aperture_user_profile ADD COLUMN IF NOT EXISTS owner_name text;

DELETE FROM public.aperture_onboarding_questions WHERE flow='quick';

INSERT INTO public.aperture_onboarding_questions
  (flow, step, sort_order, question_key, prompt, hint, input_kind, options, bucket_slugs, bucket_question_keys, section, is_active)
VALUES
  ('quick', 1, 1, 'owner_name', 'What''s your name?', NULL, 'text', '[]'::jsonb, ARRAY['basics'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 2, 'business_name', 'What''s your business called?', NULL, 'text', '[]'::jsonb, ARRAY['basics'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 3, 'industry', 'Which industry are you in?', NULL, 'single_choice', '[]'::jsonb, ARRAY['basics'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 4, 'q4_how_long', 'How long have you been running it?', NULL, 'single_choice',
    '[{"label":"Less than 1 year","value":"<1y"},{"label":"1–3 years","value":"1-3y"},{"label":"3–7 years","value":"3-7y"},{"label":"More than 7 years","value":">7y"}]'::jsonb,
    ARRAY['basics','story'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 5, 'q5_team', 'Do you work alone or do you have people helping you?', NULL, 'single_choice',
    '[{"label":"Just me","value":"solo"},{"label":"1–2 people","value":"1-2"},{"label":"3–10 people","value":"3-10"},{"label":"More than 10 people","value":">10"}]'::jsonb,
    ARRAY['basics','team'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 6, 'q6_revenue', 'Roughly how much does the business bring in per month?', NULL, 'single_choice',
    '[{"label":"Under $5,000","value":"<5k"},{"label":"$5,000–$15,000","value":"5k-15k"},{"label":"$15,000–$50,000","value":"15k-50k"},{"label":"$50,000–$100,000","value":"50k-100k"},{"label":"Over $100,000","value":">100k"},{"label":"I don''t track it consistently","value":"untracked"}]'::jsonb,
    ARRAY['basics','money'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 7, 'q7_revenue_mix', 'Where does most of your revenue come from?', NULL, 'single_choice',
    '[{"label":"Repeat clients or customers who keep coming back","value":"repeat"},{"label":"New clients every time — I''m always finding new people","value":"new"},{"label":"One or two big clients that make up most of my income","value":"big_clients"},{"label":"Walk-in or online traffic","value":"walkin"}]'::jsonb,
    ARRAY['basics','customers','sales','money'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 1, 8, 'q8_stuck', 'Where do you feel most stuck right now?', NULL, 'single_choice',
    '[{"label":"Getting more clients or customers","value":"clients"},{"label":"Making more profit from what I already have","value":"profit"},{"label":"Managing my time — I''m overwhelmed","value":"time"},{"label":"Knowing what to focus on — no clear strategy","value":"focus"},{"label":"Building a team I can trust","value":"team"},{"label":"Marketing and being visible","value":"marketing"}]'::jsonb,
    ARRAY['basics','vision'], ARRAY[]::text[], 'phase-1', true),
  ('quick', 2, 1, 'what_business', 'What kind of business do you run?', 'Anything you want Aperture to know that we haven''t covered yet. (Optional)', 'textarea', '[]'::jsonb, ARRAY['basics','products','customers'], ARRAY[]::text[], 'phase-2', true),
  ('quick', 2, 2, 'website', 'Do you have a website?', 'Optional', 'text', '[]'::jsonb, ARRAY['basics'], ARRAY[]::text[], 'phase-2', true),
  ('quick', 2, 3, 'instagram', 'What''s your Instagram handle?', 'Optional', 'text', '[]'::jsonb, ARRAY['basics'], ARRAY[]::text[], 'phase-2', true),
  ('quick', 3, 1, 'closing_help', 'How can I help you most right now?', 'If I could take one thing off your plate starting today — what would it be?', 'textarea', '[]'::jsonb, ARRAY['__notes__'], ARRAY[]::text[], 'closing', true);
