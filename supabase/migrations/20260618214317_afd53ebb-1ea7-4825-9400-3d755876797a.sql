INSERT INTO public.aperture_onboarding_questions (flow, step, question_key, prompt, hint, input_kind, options, section, sort_order, is_active)
VALUES
  ('full', 44, 'full_q44_location', 'Where are you based? (City and state/province)', 'e.g., Los Angeles, CA or Toronto, ON', 'text', '[]'::jsonb, 'contact', 44, true),
  ('full', 45, 'full_q45_phone', 'What is your phone number?', 'Include country code if possible', 'text', '[]'::jsonb, 'contact', 45, true),
  ('full', 46, 'full_q46_email', 'What is the best email to reach you?', NULL, 'text', '[]'::jsonb, 'contact', 46, true)
ON CONFLICT DO NOTHING;