
-- Insert Self-Affirmation reflection
INSERT INTO public.reflections (id, title, subtitle, is_active, is_featured, sort_order)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Self-Affirmation', 'Believe in your adaptability and competence.', true, false, 0);

-- Insert 6 pages: 5 questions + 1 message
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0, 'question', 'What do you appreciate and like about the things you own?'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, 'question', 'Write down three things that happened today or in the last week for which you''re grateful.'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, 'question', 'Take five minutes to think about all the things for which you are grateful, and write down as many as you can.'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, 'question', 'Plan and implement an activity to express your gratitude.'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, 'question', 'Thank the dark night and make a quality sleep plan for yourself today.'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, 'message', 'Prosperity and adversity are good to all. Prosperity makes us happy and adversity refines us. Gratitude is a positive attitude toward life and is a form of wisdom.');
