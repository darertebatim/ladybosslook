
-- ============================================
-- STEP 1: UPDATE 9 existing actions
-- ============================================

-- 1. Write 3 goals for this year: daily → none (one-time)
UPDATE admin_task_bank SET repeat_pattern = 'none' WHERE id = 'b1a10001-0001-4000-8000-000000000001';

-- 2. Research 1 career path today: daily → weekly
UPDATE admin_task_bank SET repeat_pattern = 'weekly' WHERE id = 'b1a10001-0001-4000-8000-000000000004';

-- 3. Learn 1 thing about the local tax system: none → weekly, fix color to sky
UPDATE admin_task_bank SET repeat_pattern = 'weekly', color = 'sky' WHERE id = 'b1a10001-0001-4000-8000-000000000006';

-- 4. Explore 1 local business regulation: none → weekly, fix color to sky
UPDATE admin_task_bank SET repeat_pattern = 'weekly', color = 'sky' WHERE id = 'b1a10001-0001-4000-8000-000000000008';

-- 5. Do 1 thing outside your comfort zone: daily → weekly
UPDATE admin_task_bank SET repeat_pattern = 'weekly' WHERE id = 'b1a10001-0001-4000-8000-000000000015';

-- 6. Apply to 1 opportunity: daily → weekly, fix color to yellow
UPDATE admin_task_bank SET repeat_pattern = 'weekly', color = 'yellow' WHERE id = 'b1a10001-0001-4000-8000-000000000019';

-- 7. Message 1 new connection: daily → weekly, fix color to lavender
UPDATE admin_task_bank SET repeat_pattern = 'weekly', color = 'lavender' WHERE id = 'b1a10001-0001-4000-8000-000000000021';

-- 8. Help someone or ask for help today: daily → weekly, fix color to lavender
UPDATE admin_task_bank SET repeat_pattern = 'weekly', color = 'lavender' WHERE id = 'b1a10001-0001-4000-8000-000000000025';

-- 9. Fix colors for consistency across pillars:
-- Direction = emerald (already correct for 001-005)
-- System = sky
UPDATE admin_task_bank SET color = 'sky' WHERE id = 'b1a10001-0001-4000-8000-000000000007'; -- Research credit score
UPDATE admin_task_bank SET color = 'sky' WHERE id = 'b1a10001-0001-4000-8000-000000000009'; -- Set up professional profile
UPDATE admin_task_bank SET color = 'sky' WHERE id = 'b1a10001-0001-4000-8000-000000000010'; -- Healthcare options
-- Confidence = pink (already correct for 011-015)
-- Income = yellow
UPDATE admin_task_bank SET color = 'yellow' WHERE id = 'b1a10001-0001-4000-8000-000000000016'; -- Side project
UPDATE admin_task_bank SET color = 'yellow' WHERE id = 'b1a10001-0001-4000-8000-000000000017'; -- Freelance platform
UPDATE admin_task_bank SET color = 'yellow' WHERE id = 'b1a10001-0001-4000-8000-000000000018'; -- Track expenses
UPDATE admin_task_bank SET color = 'yellow' WHERE id = 'b1a10001-0001-4000-8000-000000000020'; -- Learn new skill
-- Network = lavender
UPDATE admin_task_bank SET color = 'lavender' WHERE id = 'b1a10001-0001-4000-8000-000000000022'; -- Attend event
UPDATE admin_task_bank SET color = 'lavender' WHERE id = 'b1a10001-0001-4000-8000-000000000023'; -- Join community
UPDATE admin_task_bank SET color = 'lavender' WHERE id = 'b1a10001-0001-4000-8000-000000000024'; -- Small talk

-- ============================================
-- STEP 2: INSERT 35 new actions
-- ============================================

-- FIND YOUR DIRECTION (+7) - color: emerald
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, tag)
VALUES
  ('b1a10002-0001-4000-8000-000000000001', 'Write a personal vision statement', '🎯', 'build-a-new-life', 'emerald', 'none', 245, true, false, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000002', 'Set 3 milestones for the next 90 days', '📌', 'build-a-new-life', 'emerald', 'none', 246, true, false, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000003', 'List 5 transferable skills from your past career', '💡', 'build-a-new-life', 'emerald', 'none', 247, true, false, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000004', 'Map your ideal daily schedule', '🗓️', 'build-a-new-life', 'emerald', 'none', 248, true, false, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000005', 'Read 1 article about your industry locally', '📰', 'build-a-new-life', 'emerald', 'weekly', 249, true, false, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000006', 'Write down 3 things you''re grateful for today', '🙏', 'build-a-new-life', 'emerald', 'daily', 250, true, true, 'Direction'),
  ('b1a10002-0001-4000-8000-000000000007', 'Reflect: What did I learn this week?', '🪞', 'build-a-new-life', 'emerald', 'weekly', 251, true, false, 'Direction');

-- LEARN THE SYSTEM (+7) - color: sky
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, tag)
VALUES
  ('b1a10002-0002-4000-8000-000000000001', 'Research banking options and open an account', '🏦', 'build-a-new-life', 'sky', 'none', 252, true, false, 'System'),
  ('b1a10002-0002-4000-8000-000000000002', 'Learn about your visa or residency rights', '📋', 'build-a-new-life', 'sky', 'none', 253, true, true, 'System'),
  ('b1a10002-0002-4000-8000-000000000003', 'Understand how the local job market works', '🔍', 'build-a-new-life', 'sky', 'none', 254, true, false, 'System'),
  ('b1a10002-0002-4000-8000-000000000004', 'Research local education or certification options', '🎓', 'build-a-new-life', 'sky', 'weekly', 255, true, false, 'System'),
  ('b1a10002-0002-4000-8000-000000000005', 'Learn 1 new local law or regulation', '⚖️', 'build-a-new-life', 'sky', 'weekly', 256, true, false, 'System'),
  ('b1a10002-0002-4000-8000-000000000006', 'Set up utilities or essential services', '🔌', 'build-a-new-life', 'sky', 'none', 257, true, false, 'System'),
  ('b1a10002-0002-4000-8000-000000000007', 'Research public transport or commute options', '🚌', 'build-a-new-life', 'sky', 'none', 258, true, false, 'System');

-- REBUILD CONFIDENCE (+7) - color: pink
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, tag)
VALUES
  ('b1a10002-0003-4000-8000-000000000001', 'Learn 5 new words in the local language', '🗣️', 'build-a-new-life', 'pink', 'daily', 259, true, true, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000002', 'Write a list of your achievements so far', '🏆', 'build-a-new-life', 'pink', 'none', 260, true, false, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000003', 'Share your story with someone today', '💬', 'build-a-new-life', 'pink', 'weekly', 261, true, false, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000004', 'Watch 1 video in the local language', '📺', 'build-a-new-life', 'pink', 'daily', 262, true, false, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000005', 'Celebrate 1 cultural tradition from home', '🎊', 'build-a-new-life', 'pink', 'weekly', 263, true, false, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000006', 'Write a letter to your future self', '✉️', 'build-a-new-life', 'pink', 'none', 264, true, false, 'Confidence'),
  ('b1a10002-0003-4000-8000-000000000007', 'Say no to 1 thing that drains your energy', '🚫', 'build-a-new-life', 'pink', 'weekly', 265, true, false, 'Confidence');

-- GROW YOUR INCOME (+7) - color: yellow
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, tag)
VALUES
  ('b1a10002-0004-4000-8000-000000000001', 'Update your CV for the local market', '📄', 'build-a-new-life', 'yellow', 'none', 266, true, false, 'Income'),
  ('b1a10002-0004-4000-8000-000000000002', 'Research average salaries in your field', '💰', 'build-a-new-life', 'yellow', 'none', 267, true, false, 'Income'),
  ('b1a10002-0004-4000-8000-000000000003', 'Spend 20 min learning a digital skill', '💻', 'build-a-new-life', 'yellow', 'daily', 268, true, true, 'Income'),
  ('b1a10002-0004-4000-8000-000000000004', 'Set a monthly budget and review it', '📊', 'build-a-new-life', 'yellow', 'weekly', 269, true, false, 'Income'),
  ('b1a10002-0004-4000-8000-000000000005', 'Explore 1 local networking or business event', '🤝', 'build-a-new-life', 'yellow', 'weekly', 270, true, false, 'Income'),
  ('b1a10002-0004-4000-8000-000000000006', 'Save or invest a small amount today', '🐷', 'build-a-new-life', 'yellow', 'daily', 271, true, false, 'Income'),
  ('b1a10002-0004-4000-8000-000000000007', 'Brainstorm 3 business or side hustle ideas', '🧠', 'build-a-new-life', 'yellow', 'none', 272, true, false, 'Income');

-- BUILD YOUR NETWORK (+7) - color: lavender
INSERT INTO admin_task_bank (id, title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, tag)
VALUES
  ('b1a10002-0005-4000-8000-000000000001', 'Introduce yourself to a neighbor or colleague', '👋', 'build-a-new-life', 'lavender', 'weekly', 273, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000002', 'Join 1 online community related to your field', '🌐', 'build-a-new-life', 'lavender', 'none', 274, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000003', 'Volunteer for 1 hour in your community', '🙌', 'build-a-new-life', 'lavender', 'weekly', 275, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000004', 'Follow up with someone you met recently', '📩', 'build-a-new-life', 'lavender', 'weekly', 276, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000005', 'Attend a language exchange or cultural meetup', '🌍', 'build-a-new-life', 'lavender', 'weekly', 277, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000006', 'Write a thank you note to someone who helped you', '💌', 'build-a-new-life', 'lavender', 'weekly', 278, true, false, 'Network'),
  ('b1a10002-0005-4000-8000-000000000007', 'Share a useful resource with your network', '📤', 'build-a-new-life', 'lavender', 'weekly', 279, true, false, 'Network');
