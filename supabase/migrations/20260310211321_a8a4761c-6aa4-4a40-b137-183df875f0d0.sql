
-- 1. Insert "Build a New Life" category
INSERT INTO routine_categories (slug, name, icon, color, display_order, task_display_order, is_active)
VALUES ('build-a-new-life', 'Build a New Life', '🌱', 'emerald', 9, 9, true);

-- 2. Insert 5 routines into routines_bank
INSERT INTO routines_bank (id, title, subtitle, description, category, color, emoji, is_active, is_popular, is_free, sort_order, schedule_type)
VALUES
  ('b1a00001-0001-4000-8000-000000000001', 'Find Your Direction', 'Rebuild clarity and purpose in your new chapter', '<p>Starting over in a new country can feel like losing your compass. This routine helps you reconnect with your strengths, set meaningful goals, and design a clear path forward — one step at a time.</p>', 'build-a-new-life', 'emerald', '🧭', true, true, true, 1, 'daily'),
  ('b1a00001-0001-4000-8000-000000000002', 'Learn the System', 'Navigate your new country with confidence', '<p>Every country has its own rules — credit, taxes, employment, healthcare. This routine gives you small daily tasks to learn the systems that matter most, so you stop feeling lost and start feeling in control.</p>', 'build-a-new-life', 'sky', '📋', true, false, true, 2, 'daily'),
  ('b1a00001-0001-4000-8000-000000000003', 'Rebuild Confidence', 'Reclaim your identity and self-belief', '<p>Language barriers, cultural shifts, and starting below your level can shake your confidence. This routine helps you practice your voice, celebrate your wins, and rebuild the unshakeable version of yourself.</p>', 'build-a-new-life', 'pink', '💪', true, true, true, 3, 'daily'),
  ('b1a00001-0001-4000-8000-000000000004', 'Grow Your Income', 'Take daily steps toward financial progress', '<p>Most immigrants are highly motivated to improve their income quickly. This routine keeps you focused on practical actions — exploring opportunities, building skills, and moving toward financial stability every day.</p>', 'build-a-new-life', 'yellow', '💰', true, true, true, 4, 'daily'),
  ('b1a00001-0001-4000-8000-000000000005', 'Build Your Network', 'Create meaningful connections in your new home', '<p>Your old network is far away. This routine helps you intentionally build new relationships — professional contacts, friendships, and community ties that become your support system in this new chapter.</p>', 'build-a-new-life', 'lavender', '🤝', true, false, true, 5, 'daily');

-- 3. Insert actions into admin_task_bank
-- Direction actions
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, goal_enabled, reminder_enabled)
VALUES
  ('b1a10001-0001-4000-8000-000000000001', 'Write 3 goals for this year', '🎯', 'build-a-new-life', 'emerald', 'daily', 200, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000002', 'Review your skills and strengths', '💎', 'build-a-new-life', 'emerald', 'weekly', 201, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000003', 'Define your ideal week', '📅', 'build-a-new-life', 'emerald', 'weekly', 202, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000004', 'Research 1 career path today', '🔍', 'build-a-new-life', 'emerald', 'daily', 203, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000005', 'Journal: Where do I want to be in 1 year?', '📝', 'build-a-new-life', 'emerald', 'weekly', 204, true, false, false, false),
-- System actions
  ('b1a10001-0001-4000-8000-000000000006', 'Learn 1 thing about the local tax system', '🏛️', 'build-a-new-life', 'sky', 'daily', 210, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000007', 'Research credit score basics', '💳', 'build-a-new-life', 'sky', 'weekly', 211, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000008', 'Explore 1 local business regulation', '📑', 'build-a-new-life', 'sky', 'daily', 212, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000009', 'Set up or update a professional profile', '👤', 'build-a-new-life', 'sky', 'weekly', 213, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000010', 'Read about healthcare or insurance options', '🏥', 'build-a-new-life', 'sky', 'weekly', 214, true, false, false, false),
-- Confidence actions
  ('b1a10001-0001-4000-8000-000000000011', 'Practice speaking for 10 minutes', '🗣️', 'build-a-new-life', 'pink', 'daily', 220, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000012', 'Write down 1 win from today', '🏆', 'build-a-new-life', 'pink', 'daily', 221, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000013', 'Record yourself speaking for 2 min', '🎙️', 'build-a-new-life', 'pink', 'weekly', 222, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000014', 'Affirm your professional identity', '✨', 'build-a-new-life', 'pink', 'daily', 223, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000015', 'Do 1 thing outside your comfort zone', '🚀', 'build-a-new-life', 'pink', 'daily', 224, true, false, false, false),
-- Income actions
  ('b1a10001-0001-4000-8000-000000000016', 'Spend 30 min on a side project', '⚡', 'build-a-new-life', 'yellow', 'daily', 230, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000017', 'Research 1 freelance platform', '💻', 'build-a-new-life', 'yellow', 'weekly', 231, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000018', 'Track your expenses today', '📊', 'build-a-new-life', 'yellow', 'daily', 232, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000019', 'Apply to 1 opportunity', '📨', 'build-a-new-life', 'yellow', 'daily', 233, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000020', 'Learn 1 new skill for 15 minutes', '📚', 'build-a-new-life', 'yellow', 'daily', 234, true, false, false, false),
-- Network actions
  ('b1a10001-0001-4000-8000-000000000021', 'Message 1 new connection', '💬', 'build-a-new-life', 'lavender', 'daily', 240, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000022', 'Attend 1 local or online event this week', '🎪', 'build-a-new-life', 'lavender', 'weekly', 241, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000023', 'Join a community group or forum', '🌐', 'build-a-new-life', 'lavender', 'weekly', 242, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000024', 'Practice 1 small talk conversation', '☕', 'build-a-new-life', 'lavender', 'daily', 243, true, false, false, false),
  ('b1a10001-0001-4000-8000-000000000025', 'Help someone or ask for help today', '🙌', 'build-a-new-life', 'lavender', 'daily', 244, true, false, false, false);

-- 4. Link actions to routines via routines_bank_tasks
-- Find Your Direction tasks
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
VALUES
  ('b1a00001-0001-4000-8000-000000000001', 'b1a10001-0001-4000-8000-000000000001', 'Write 3 goals for this year', '🎯', 1),
  ('b1a00001-0001-4000-8000-000000000001', 'b1a10001-0001-4000-8000-000000000002', 'Review your skills and strengths', '💎', 2),
  ('b1a00001-0001-4000-8000-000000000001', 'b1a10001-0001-4000-8000-000000000003', 'Define your ideal week', '📅', 3),
  ('b1a00001-0001-4000-8000-000000000001', 'b1a10001-0001-4000-8000-000000000004', 'Research 1 career path today', '🔍', 4),
  ('b1a00001-0001-4000-8000-000000000001', 'b1a10001-0001-4000-8000-000000000005', 'Journal: Where do I want to be in 1 year?', '📝', 5);

-- Learn the System tasks
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
VALUES
  ('b1a00001-0001-4000-8000-000000000002', 'b1a10001-0001-4000-8000-000000000006', 'Learn 1 thing about the local tax system', '🏛️', 1),
  ('b1a00001-0001-4000-8000-000000000002', 'b1a10001-0001-4000-8000-000000000007', 'Research credit score basics', '💳', 2),
  ('b1a00001-0001-4000-8000-000000000002', 'b1a10001-0001-4000-8000-000000000008', 'Explore 1 local business regulation', '📑', 3),
  ('b1a00001-0001-4000-8000-000000000002', 'b1a10001-0001-4000-8000-000000000009', 'Set up or update a professional profile', '👤', 4),
  ('b1a00001-0001-4000-8000-000000000002', 'b1a10001-0001-4000-8000-000000000010', 'Read about healthcare or insurance options', '🏥', 5);

-- Rebuild Confidence tasks
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
VALUES
  ('b1a00001-0001-4000-8000-000000000003', 'b1a10001-0001-4000-8000-000000000011', 'Practice speaking for 10 minutes', '🗣️', 1),
  ('b1a00001-0001-4000-8000-000000000003', 'b1a10001-0001-4000-8000-000000000012', 'Write down 1 win from today', '🏆', 2),
  ('b1a00001-0001-4000-8000-000000000003', 'b1a10001-0001-4000-8000-000000000013', 'Record yourself speaking for 2 min', '🎙️', 3),
  ('b1a00001-0001-4000-8000-000000000003', 'b1a10001-0001-4000-8000-000000000014', 'Affirm your professional identity', '✨', 4),
  ('b1a00001-0001-4000-8000-000000000003', 'b1a10001-0001-4000-8000-000000000015', 'Do 1 thing outside your comfort zone', '🚀', 5);

-- Grow Your Income tasks
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
VALUES
  ('b1a00001-0001-4000-8000-000000000004', 'b1a10001-0001-4000-8000-000000000016', 'Spend 30 min on a side project', '⚡', 1),
  ('b1a00001-0001-4000-8000-000000000004', 'b1a10001-0001-4000-8000-000000000017', 'Research 1 freelance platform', '💻', 2),
  ('b1a00001-0001-4000-8000-000000000004', 'b1a10001-0001-4000-8000-000000000018', 'Track your expenses today', '📊', 3),
  ('b1a00001-0001-4000-8000-000000000004', 'b1a10001-0001-4000-8000-000000000019', 'Apply to 1 opportunity', '📨', 4),
  ('b1a00001-0001-4000-8000-000000000004', 'b1a10001-0001-4000-8000-000000000020', 'Learn 1 new skill for 15 minutes', '📚', 5);

-- Build Your Network tasks
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
VALUES
  ('b1a00001-0001-4000-8000-000000000005', 'b1a10001-0001-4000-8000-000000000021', 'Message 1 new connection', '💬', 1),
  ('b1a00001-0001-4000-8000-000000000005', 'b1a10001-0001-4000-8000-000000000022', 'Attend 1 local or online event this week', '🎪', 2),
  ('b1a00001-0001-4000-8000-000000000005', 'b1a10001-0001-4000-8000-000000000023', 'Join a community group or forum', '🌐', 3),
  ('b1a00001-0001-4000-8000-000000000005', 'b1a10001-0001-4000-8000-000000000024', 'Practice 1 small talk conversation', '☕', 4),
  ('b1a00001-0001-4000-8000-000000000005', 'b1a10001-0001-4000-8000-000000000025', 'Help someone or ask for help today', '🙌', 5);
