
-- Insert sample story
INSERT INTO public.reading_content (id, title, subtitle, description, author, type, category, reading_time_minutes, theme_color, is_published, sort_order)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'The Jar of Stones',
  'A story about what really matters',
  'A philosophy professor stood before his class with a large empty jar. What he did next changed how his students saw their lives forever.',
  'Ancient Parable',
  'story',
  'mindset',
  5,
  '#F0E3FF',
  true,
  1
);

-- Insert sections
INSERT INTO public.reading_sections (content_id, sort_order, heading, body, quote) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 'The Empty Jar',
'A philosophy professor stood before his class one morning with an unusual collection of items spread across his desk. Without saying a word, he picked up a large, empty glass jar and began filling it with golf balls.

He looked at the class and asked, "Is the jar full?"

The students nodded. Yes, it appeared to be full.',
'Sometimes what appears full is far from it.'),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 'The Pebbles',
'The professor then picked up a box of small pebbles and poured them into the jar. He shook it lightly, and the pebbles rolled into the open spaces between the golf balls.

Again he asked, "Is the jar full?"

The students laughed and agreed that yes, now it was truly full.',
'There is always more room than you think.'),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, 'The Sand',
'Next, the professor picked up a box of sand and poured it into the jar. The fine grains filled every remaining gap between the pebbles and golf balls.

"Now," he said with a smile, "this jar represents your life."',
NULL),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 'The Meaning',
'The golf balls are the important things — your health, your family, your passions — the things that, if everything else were lost, would still make your life feel full.

The pebbles are the other things that matter — your job, your home, your car.

The sand is everything else. The small stuff. The noise.',
'If you put the sand in first, there is no room for the golf balls.'),

('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, 'The Lesson',
'If you spend all your time and energy on the small stuff, you will never have room for the things that truly matter to you.

Pay attention to the things that are critical to your happiness. Take care of the golf balls first — the things that really matter.

Set your priorities. The rest is just sand.',
'Take care of the golf balls first — everything else is just sand.');
