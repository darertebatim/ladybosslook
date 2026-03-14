
-- Routine 1: Level Up - Daily Actions
INSERT INTO routines_bank_tasks (routine_id, section_id, section_title, title, emoji, task_order, schedule_days, is_once) VALUES
('2c21d8ac-2293-4194-bd24-17bcdd11640c', '83d0bb64-b0b0-4e9f-8134-b2f78a7e6a23', 'Daily Actions', 'Jot down 1 thing you''re grateful for', '🙏', 1, '{0,1,2,3,4,5,6}', false),
('2c21d8ac-2293-4194-bd24-17bcdd11640c', '83d0bb64-b0b0-4e9f-8134-b2f78a7e6a23', 'Daily Actions', 'Choose 1 activity and focus on it for 5 minutes', '🧘', 2, '{0,1,2,3,4,5,6}', false),
('2c21d8ac-2293-4194-bd24-17bcdd11640c', '83d0bb64-b0b0-4e9f-8134-b2f78a7e6a23', 'Daily Actions', 'Text, call, or compliment 1 person you care about', '💬', 3, '{0,1,2,3,4,5,6}', false),
('2c21d8ac-2293-4194-bd24-17bcdd11640c', '83d0bb64-b0b0-4e9f-8134-b2f78a7e6a23', 'Daily Actions', 'Reflect on a good quality you showed or want to', '💭', 4, '{0,1,2,3,4,5,6}', false);

-- Routine 1: Level Up - Weekly Actions
INSERT INTO routines_bank_tasks (routine_id, section_id, section_title, title, emoji, task_order, schedule_days, is_once) VALUES
('2c21d8ac-2293-4194-bd24-17bcdd11640c', '4546b0c6-fadd-4fd9-8599-46fceca94536', 'Weekly Actions', 'Choose 1 habit and try it for a week', '🎯', 5, '{1}', false);

-- Routine 2: Project 50 - Daily Actions
INSERT INTO routines_bank_tasks (routine_id, section_id, section_title, title, emoji, task_order, schedule_days, is_once) VALUES
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Wake Up Before 8 AM', '☀️', 1, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Follow a Morning Routine', '🧘', 2, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Exercise for 1 Hour Every Day', '💪', 3, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Read 10 Pages of a Book', '📖', 4, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Spend 1 Hour Learning a New Skill', '🚀', 5, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Eat Healthy & Avoid Junk Food', '🥗', 6, '{0,1,2,3,4,5,6}', false),
('67047e18-5711-4fcf-bc77-59431407509c', 'b4bb6ca7-dd67-451e-96bf-9dbf30ba67a8', 'Daily Actions', 'Track Your Daily Progress', '📅', 7, '{0,1,2,3,4,5,6}', false);

-- Routine 3: First Date - Special Events (one-time actions)
INSERT INTO routines_bank_tasks (routine_id, section_id, section_title, title, emoji, task_order, schedule_days, is_once) VALUES
('ab80796d-da1c-47d8-b5a0-4c2faf41df18', '8f51c77f-221b-49b4-a6ab-a2451d7fc467', 'Special Events', 'Set Up Physical Contact', '🤗', 1, '{}', true),
('ab80796d-da1c-47d8-b5a0-4c2faf41df18', '8f51c77f-221b-49b4-a6ab-a2451d7fc467', 'Special Events', 'Choose the Right Seating Arrangement', '💺', 2, '{}', true),
('ab80796d-da1c-47d8-b5a0-4c2faf41df18', '8f51c77f-221b-49b4-a6ab-a2451d7fc467', 'Special Events', 'Engage in External Activities', '🎭', 3, '{}', true),
('ab80796d-da1c-47d8-b5a0-4c2faf41df18', '8f51c77f-221b-49b4-a6ab-a2451d7fc467', 'Special Events', 'Relax and Reduce Stress', '😌', 4, '{}', true);
