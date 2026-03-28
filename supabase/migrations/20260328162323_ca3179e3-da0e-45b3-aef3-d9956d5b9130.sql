
-- Morning Reflection
INSERT INTO reflections (id, title, subtitle, is_active, is_featured, is_free, category, sort_order)
VALUES 
('a1b2c3d4-1111-4aaa-bbbb-000000000001', 'Morning Reflection', 'What''s on your mind?', true, false, false, 'morning', 19),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 'Sleep Reflection', 'Are you feeling well rested?', true, false, false, 'morning', 20),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 'Hype Machine', 'What sparked some energy today?', true, false, false, 'morning', 21);

-- Morning Reflection pages
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-1111-4aaa-bbbb-000000000001', 0, 'question', 'How is the day so far?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000001', 1, 'question', 'What is impacting your energy for today?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000001', 2, 'question', 'What''s one thing you''d like to do well today?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000001', 3, 'question', 'What is influencing your motivation?', NULL);

-- Sleep Reflection pages
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 0, 'question', 'How did your body feel when you woke up?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 1, 'question', 'Are you feeling well rested?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 2, 'question', 'How different is your weekend sleep from your weekday sleep?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 3, 'question', 'How did you unwind before bed last night?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 4, 'question', 'How was your sleep last night?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 5, 'question', 'Was there anything different about your sleep last night?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 6, 'question', 'What did you do before going to bed last night?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000002', 7, 'question', 'How did your mind feel when you woke up?', NULL);

-- Hype Machine pages
INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 0, 'question', 'What do you look forward to today?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 1, 'question', 'What about today can you be optimistic about?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 2, 'question', 'Who can you look forward to today?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 3, 'question', 'What is something you can look forward to this week?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 4, 'question', 'Is there an energizing moment you can make time for today?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 5, 'question', 'What is one thing in your control to bring energy to the day?', NULL),
('a1b2c3d4-1111-4aaa-bbbb-000000000003', 6, 'question', 'What is one thing to be optimistic about today?', NULL);
