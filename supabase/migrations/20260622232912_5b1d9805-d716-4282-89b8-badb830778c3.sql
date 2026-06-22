INSERT INTO public.aperture_onboarding_questions
  (flow, step, sort_order, question_key, prompt, hint, input_kind, options, bucket_slugs, bucket_question_keys, section, is_active)
VALUES
  ('quick', 2, 3, 'ai_tool', 'Which AI tool do you use the most?', NULL, 'single_choice',
   '[{"label":"ChatGPT","value":"chatgpt"},{"label":"Claude","value":"claude"},{"label":"Gemini","value":"gemini"},{"label":"Grok","value":"grok"},{"label":"Other","value":"other"},{"label":"I do not use AI","value":"none"}]'::jsonb,
   ARRAY['basics'], ARRAY[]::text[], 'phase-2', true)
ON CONFLICT DO NOTHING;