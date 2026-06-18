
UPDATE aperture_onboarding_questions
SET options = '[{"label":"Just started","value":"just_started"},{"label":"Less than 1 year","value":"<1y"},{"label":"1–3 years","value":"1-3y"},{"label":"3–7 years","value":"3-7y"},{"label":"More than 7 years","value":">7y"}]'::jsonb
WHERE question_key = 'q4_how_long' AND flow = 'quick';

UPDATE aperture_onboarding_questions SET sort_order = 4 WHERE question_key = 'what_business' AND flow = 'quick';
UPDATE aperture_onboarding_questions SET sort_order = 1 WHERE question_key = 'website' AND flow = 'quick';
UPDATE aperture_onboarding_questions SET sort_order = 2 WHERE question_key = 'instagram' AND flow = 'quick';
