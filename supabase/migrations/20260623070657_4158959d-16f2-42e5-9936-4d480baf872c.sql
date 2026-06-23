
-- Shift subsequent questions to make room
UPDATE public.aperture_onboarding_questions SET sort_order = sort_order + 2
WHERE flow='full' AND sort_order >= 26;

INSERT INTO public.aperture_onboarding_questions
(flow, step, question_key, prompt, hint, input_kind, options, bucket_slugs, bucket_question_keys, section, sort_order, is_active)
VALUES
('full', 19, 'full_q19a_ideal_match',
 'Is that who you actually want to be serving?',
 NULL, 'single_choice',
 '[{"label":"Yes — I''m reaching exactly who I want","value":"yes"},
   {"label":"Not quite — I have an ideal customer in mind but I''m not fully reaching them yet","value":"not_quite"},
   {"label":"No — I want to reach a completely different type of customer","value":"different"},
   {"label":"I haven''t really thought about it","value":"not_thought"}]'::jsonb,
 ARRAY['customers']::text[],
 ARRAY['b3_q17','b3_q8']::text[],
 'marketing', 26, true),
('full', 19, 'full_q19b_ideal_describe',
 'Describe your ideal customer in your own words',
 'Optional — the more specific, the better.',
 'textarea',
 '[]'::jsonb,
 ARRAY['customers']::text[],
 ARRAY['b3_q8','b3_q27']::text[],
 'marketing', 27, true);
