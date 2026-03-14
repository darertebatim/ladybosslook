
-- Insert 16 actions from 3 routines into admin_task_bank
-- and link them back to routines_bank_tasks

-- Level Up Your Life actions (yellow, daily/weekly)
WITH level_up AS (
  INSERT INTO admin_task_bank (title, emoji, category, color, sort_order, repeat_pattern, repeat_days, is_active, duration_minutes)
  VALUES
    ('Jot down 1 thing you''re grateful for', '🙏', 'takecareofmyself', 'yellow', 448, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Choose 1 activity and focus on it for 5 minutes', '🧘', 'takecareofmyself', 'yellow', 449, 'daily', ARRAY[0,1,2,3,4,5,6], true, 5),
    ('Text, call, or compliment 1 person you care about', '💬', 'takecareofmyself', 'yellow', 450, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Reflect on a good quality you showed or want to', '💭', 'takecareofmyself', 'yellow', 451, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Choose 1 habit and try it for a week', '🎯', 'takecareofmyself', 'yellow', 452, 'weekly', ARRAY[1], true, 1)
  RETURNING id, title
),
-- Project 50 actions (mint, daily)
project50 AS (
  INSERT INTO admin_task_bank (title, emoji, category, color, sort_order, repeat_pattern, repeat_days, is_active, duration_minutes)
  VALUES
    ('Wake Up Before 8 AM', '☀️', 'takecareofmyself', 'mint', 453, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Follow a Morning Routine', '🧘', 'takecareofmyself', 'mint', 454, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Exercise for 1 Hour Every Day', '💪', 'takecareofmyself', 'mint', 455, 'daily', ARRAY[0,1,2,3,4,5,6], true, 60),
    ('Read 10 Pages of a Book', '📖', 'takecareofmyself', 'mint', 456, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Spend 1 Hour Learning a New Skill', '🚀', 'takecareofmyself', 'mint', 457, 'daily', ARRAY[0,1,2,3,4,5,6], true, 60),
    ('Eat Healthy & Avoid Junk Food', '🥗', 'takecareofmyself', 'mint', 458, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1),
    ('Track Your Daily Progress', '📅', 'takecareofmyself', 'mint', 459, 'daily', ARRAY[0,1,2,3,4,5,6], true, 1)
  RETURNING id, title
),
-- First Date actions (pink, one-time)
first_date AS (
  INSERT INTO admin_task_bank (title, emoji, category, color, sort_order, repeat_pattern, repeat_days, is_active, duration_minutes)
  VALUES
    ('Set Up Physical Contact', '🤗', 'takecareofmyself', 'pink', 460, 'none', NULL, true, 1),
    ('Choose the Right Seating Arrangement', '💺', 'takecareofmyself', 'pink', 461, 'none', NULL, true, 1),
    ('Engage in External Activities', '🎭', 'takecareofmyself', 'pink', 462, 'none', NULL, true, 1),
    ('Relax and Reduce Stress', '😌', 'takecareofmyself', 'pink', 463, 'none', NULL, true, 1)
  RETURNING id, title
),
-- Now link them to routines_bank_tasks by matching titles
all_inserted AS (
  SELECT * FROM level_up
  UNION ALL SELECT * FROM project50
  UNION ALL SELECT * FROM first_date
)
UPDATE routines_bank_tasks rbt
SET task_id = ai.id
FROM all_inserted ai
WHERE rbt.title = ai.title
  AND rbt.task_id IN (
    SELECT rbt2.id FROM routines_bank_tasks rbt2
    JOIN routines_bank rb ON rb.id = rbt2.routine_id
    WHERE rb.title IN (
      'Level Up Your Life: Unlock Happiness Today!',
      'Project 50 Challenge & Transform Your Life!',
      'How to Make Your First Date Less Awkward: 3 EASY TRICKS'
    )
  );
