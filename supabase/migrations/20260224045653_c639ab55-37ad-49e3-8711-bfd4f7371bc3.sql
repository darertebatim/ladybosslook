
-- Insert the "Self-Affirmation" reflection
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES (
  'Self-Affirmation',
  'Believe in your adaptability and competence.',
  'https://id-preview--9d54663c-1af5-4066-9ceb-1723206ae5f8.lovable.app/images/reflections/self-affirmation.jpg',
  true,
  false,
  1
);

-- Insert pages
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description)
SELECT id, 0, 'question', 'Write down three of the best things you''ve accomplished so far.', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 1, 'question', 'Write down three things you like most about yourself.', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 2, 'question', 'How do other people react when you overcome difficulties?', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 3, 'message', 'You are great!
You overcome obstacles and accomplish difficult tasks!', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 4, 'question', 'What is most important to you? Why do you think it matters?', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 5, 'question', 'What worries are overshadowing the things that matter to you most right now?', NULL
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 6, 'message', 'Broaden your horizons!', 'You should focus on whatever is most important to you and look at everything else objectively.'
FROM reflections WHERE title = 'Self-Affirmation'
UNION ALL
SELECT id, 7, 'message', 'Escape the cycle of low self-esteem and beware of the "I can''t" suggestion.', 'Learn to describe facts objectively.
Refuse to complain or attack yourself.

When problems arise, stay calm, think of solutions, and accept your imperfections.

Stay away from aggressors and people who hurt you. Reach out to people who are kind and gentle.'
FROM reflections WHERE title = 'Self-Affirmation';
