-- 1. Fix all focus routine tasks: set schedule_days to NULL (these are timer sessions, not weekly recurring)
UPDATE routines_bank_tasks
SET schedule_days = NULL
WHERE routine_id IN (SELECT id FROM routines_bank WHERE is_focus = true);

-- 2. Add missing Miracle Morning SAVERS tasks (currently only 2 of 7)
-- Routine ID: 27cf61d8-66ae-4a81-8cb8-f62b0089cbfc
-- Existing: 1. Tidy up your bed, 2. Take deep breaths and meditate
-- Missing: Affirmations, Visualization, Exercise, Reading, Scribing

INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, task_order)
VALUES
  ('27cf61d8-66ae-4a81-8cb8-f62b0089cbfc', 'Affirmations', '🗣️', 2, 3),
  ('27cf61d8-66ae-4a81-8cb8-f62b0089cbfc', 'Visualization', '🎯', 2, 4),
  ('27cf61d8-66ae-4a81-8cb8-f62b0089cbfc', 'Exercise', '🏃', 3, 5),
  ('27cf61d8-66ae-4a81-8cb8-f62b0089cbfc', 'Reading', '📖', 3, 6),
  ('27cf61d8-66ae-4a81-8cb8-f62b0089cbfc', 'Scribing (Journaling)', '✍️', 3, 7);