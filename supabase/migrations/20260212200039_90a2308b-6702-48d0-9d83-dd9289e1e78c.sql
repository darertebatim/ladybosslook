
-- Insert 6 workout actions into admin_task_bank
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, repeat_days, description, is_active, is_popular, sort_order)
VALUES
  ('Day1 (GLUTES + QUADS)', '☀️', 'mint', 'workoutplus', 'weekly', '{}', NULL, true, false, 1),
  ('Day2 (BACK + ARMS)', '☀️', 'mint', 'workoutplus', 'weekly', '{}', NULL, true, false, 2),
  ('Day3 (Core)', '💪', 'mint', 'workoutplus', 'weekly', '{6}', 'Theme: Waist + nervous system. Core focus: Deep core + pelvic floor', true, false, 3),
  ('Day4 (Leg/Core)', '☀️', 'mint', 'workoutplus', 'weekly', '{}', NULL, true, false, 4),
  ('Day5 (SHOULDERS + CHEST)', '💪', 'mint', 'workoutplus', 'weekly', '{}', NULL, true, false, 5),
  ('Gym Rest (Walking)', '☀️', 'mint', 'workoutplus', 'weekly', '{}', NULL, true, false, 6);

-- Now insert subtasks for each action
-- Day1 (GLUTES + QUADS) subtasks
INSERT INTO admin_task_bank_subtasks (task_id, title, order_index)
SELECT id, unnest(ARRAY[
  '1. Back Squat or Goblet Squat — 4×6–8',
  '2A. Hip Thrust — 3×10–12 / 2B. Heel-Elevated Goblet Squat — 3×12',
  '3. Walking Lunges — 2×14 total',
  '4. Seated or Lying Leg Curl — 3×12',
  '5. Dead Bug (slow) — 3×6–8'
]), unnest(ARRAY[0,1,2,3,4])
FROM admin_task_bank WHERE title = 'Day1 (GLUTES + QUADS)' AND category = 'workoutplus';

-- Day2 (BACK + ARMS) subtasks
INSERT INTO admin_task_bank_subtasks (task_id, title, order_index)
SELECT id, unnest(ARRAY[
  '1. Lat Pulldown (neutral or wide) — 4×8–10',
  '2. Chest-Supported Row — 3×10–12',
  '3A. Incline DB Curl — 3×10 / 3B. Rope Triceps Pushdown — 3×12',
  '4. Face Pull — 3×15',
  '5. Pallof Press — 3×10/side',
  'Row erg or bike — 8–12 min'
]), unnest(ARRAY[0,1,2,3,4,5])
FROM admin_task_bank WHERE title = 'Day2 (BACK + ARMS)' AND category = 'workoutplus';

-- Day3 (Core) subtasks
INSERT INTO admin_task_bank_subtasks (task_id, title, order_index)
SELECT id, unnest(ARRAY[
  'Core Circuit (3 rounds): 1. Side Plank — 25–35 sec/side / 2. Cable Crunch — 12–15 / 3. Bird Dog (slow) — 8/side',
  '4. Hip Bridge (pause at top) — 3×12 / 5. Back Extension (glute bias) — 2×12',
  'Low-intensity cardio — 20 min'
]), unnest(ARRAY[0,1,2])
FROM admin_task_bank WHERE title = 'Day3 (Core)' AND category = 'workoutplus';

-- Day4 (Leg/Core) subtasks
INSERT INTO admin_task_bank_subtasks (task_id, title, order_index)
SELECT id, unnest(ARRAY[
  '1. Romanian Deadlift — 4×8',
  '2A. Bulgarian Split Squat — 3×8/leg / 2B. Single-Leg Hip Thrust — 3×10/leg',
  '3. Cable Pull-Through or Hip Abduction — 3×15',
  '4. Suitcase Carry — 3×30–40 sec',
  'StairMaster — 8–10 min'
]), unnest(ARRAY[0,1,2,3,4])
FROM admin_task_bank WHERE title = 'Day4 (Leg/Core)' AND category = 'workoutplus';

-- Day5 (SHOULDERS + CHEST) subtasks
INSERT INTO admin_task_bank_subtasks (task_id, title, order_index)
SELECT id, unnest(ARRAY[
  '1. DB Shoulder Press — 4×8',
  '2A. Incline Chest Press — 3×8–10 / 2B. Push-Ups — 3×AMRAP (clean reps)',
  '3A. Lateral Raise — 3×12 / 3B. Rear Delt Fly — 3×15',
  'Incline Plank — 3×20–30 sec'
]), unnest(ARRAY[0,1,2,3])
FROM admin_task_bank WHERE title = 'Day5 (SHOULDERS + CHEST)' AND category = 'workoutplus';

-- Gym Rest (Walking) has no subtasks
