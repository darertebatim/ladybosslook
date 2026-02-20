
-- Insert the weekly Wall Pilates task with all 10 subtasks
-- Wall Pilates repeats every weekday (Mon-Fri = days 1,2,3,4,5)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once, section_title) VALUES
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Wall Side Knee Bends', '🧘', 1, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Wall Butterfly Pose', '🦋', 2, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Wall Open Armed Bended Knee', '🤲', 3, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Wall Straddle Stretch', '🦵', 4, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Reach Through Series', '💪', 5, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Butterfly Openers', '🤸', 6, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Alternating Side Hip Slides', '↔️', 7, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Alternating Leg Abduction', '🦶', 8, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Opposite Toe Reach', '🙆', 9, ARRAY[1,2,3,4,5], false, NULL),
  (gen_random_uuid(), 'ebfe3527-77ae-44cb-8633-ad782312b680', 'Seated Active Forward Fold', '🧎', 10, ARRAY[1,2,3,4,5], false, NULL);
