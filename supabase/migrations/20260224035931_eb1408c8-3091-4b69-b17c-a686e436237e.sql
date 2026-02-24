
-- Insert the Pure Reflection
INSERT INTO reflections (title, subtitle, is_active, is_featured, sort_order)
VALUES ('Pure Reflection', 'Clarify the purpose and meaning of your life.', true, false, 1);

-- Insert all pages for this reflection
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description)
SELECT r.id, p.page_order, p.type, p.content, p.description
FROM reflections r
CROSS JOIN (VALUES
  (1, 'message', 'Timely self-reflection can help you progress.', 'Heine said, "Reflection is a mirror. It can see our mistakes clearly so that we have the opportunity to correct them."'),
  (2, 'message', 'Be true to who you are and embrace your vulnerable feelings without fear or avoidance.', NULL),
  (3, 'question', 'Calm down and reflect on the day.', NULL),
  (4, 'question', 'Take five minutes to reflect deeply on all the life choices you''ve made.', NULL),
  (5, 'question', 'What kind of person do you want to be?', NULL),
  (6, 'question', 'What measures are you going to take to get there?', NULL),
  (7, 'question', 'What do you want to say to yourself? I will listen to you and stay with you.', NULL),
  (8, 'message', 'Those who do not know how to reflect will eventually fall into an abyss of their own making.', 'The philosopher Descartes said very profound words: "Self-reflection is the fountainhead of all thought.

It is in thinking of oneself, not of others, that one develops wisdom."

If people spend too much time focusing on others, they''ll have little time left to think for themselves.

A wise man makes the same mistake only once; a fool makes the same mistake many times and remains uncorrected.')
) AS p(page_order, type, content, description)
WHERE r.title = 'Pure Reflection';
