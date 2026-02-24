
-- Insert the "When You Feel Lonely" reflection
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES (
  'When You Feel Lonely',
  'I''ll give you a big hug.',
  'https://id-preview--9d54663c-1af5-4066-9ceb-1723206ae5f8.lovable.app/images/reflections/when-you-feel-lonely.jpg',
  true,
  false,
  2
);

-- Insert pages for this reflection
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description)
SELECT id, 0, 'question', 'What makes you feel like others understand you?', NULL
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 1, 'question', 'What activity makes you feel fulfilled?', NULL
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 2, 'question', 'Do you want to learn something new?', 'If so, write down your study plan.'
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 3, 'question', 'Do you want to say something to someone you trust?', 'If so, write down what you want to say and set up a time to talk with him or her.'
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 4, 'message', 'Maybe life is supposed to be lonely.', 'Only by embracing ourselves, being true to ourselves, and not living to please others in the outside world can we make life calmer and take every moment it gives us.'
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 5, 'message', 'Enjoying loneliness is a process of self-enrichment.', 'Only when you learn to appreciate yourself in loneliness can you truly grow up.'
FROM reflections WHERE title = 'When You Feel Lonely'
UNION ALL
SELECT id, 6, 'message', 'Learning to live with yourself will make your life''s journey richer and more meaningful.', 'Reject ineffective social interactions and devote more time and energy to yourself.

Develop hobbies and concentrate on learning and thinking.'
FROM reflections WHERE title = 'When You Feel Lonely';
