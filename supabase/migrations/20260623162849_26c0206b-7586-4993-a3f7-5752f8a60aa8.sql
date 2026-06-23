UPDATE public.aperture_onboarding_questions
SET options = '[
  {"label":"Just started (brand new business)","value":"brand-new"},
  {"label":"Less than 1 year","value":"<1y"},
  {"label":"Between 1 and 3 years","value":"1-3y"},
  {"label":"Between 3 and 7 years","value":"3-7y"},
  {"label":"More than 7 years","value":">7y"}
]'::jsonb
WHERE flow = 'full' AND question_key = 'full_q2_how_long';