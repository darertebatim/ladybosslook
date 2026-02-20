
-- Insert tasks for Ritual 1: Beat the Cramps (id: 5cc040f0-414e-43db-9660-afade5a21105)
-- Daily tasks (schedule_days = every day = [0,1,2,3,4,5,6])
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once) VALUES
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Exercise regularly', '🏃', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Take supplements', '💊', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Eat anti-inflammatory foods', '🥗', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Maintain a healthy diet', '🥦', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Get adequate sleep', '🛏️', 5, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly task (Monday = day index 1)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once) VALUES
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Practice mindfulness', '🧘', 6, ARRAY[1], false);

-- Monthly tasks (days 8-14 of the month, stored as monthly_day for each)
-- We insert 7 tasks for the 7 period days using monthly_day field
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, monthly_day, is_once) VALUES
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Stay hydrated', '💧', 7, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Apply heat', '🌡️', 8, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Wear comfortable clothing', '👕', 9, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Practice gentle stretching', '🤸', 10, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Try massage therapy', '💆', 11, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Take pain relievers', '💊', 12, ARRAY[]::int[], 8, false),
  (gen_random_uuid(), '5cc040f0-414e-43db-9660-afade5a21105', 'Consult a doctor when needed', '🩺', 13, ARRAY[]::int[], 8, false);
