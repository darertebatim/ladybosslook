-- Create the "Daily Reset" routine in routines_bank
INSERT INTO routines_bank (
  title, emoji, category, description, subtitle,
  schedule_type, is_active, is_free, is_featured, is_popular,
  sort_order, color, cover_aspect, end_mode
) VALUES (
  'Daily Reset', '🔄', 'wellness', 
  'A simple 5-step daily routine to ground yourself, check in with your emotions, breathe, reflect, and get one thing done.',
  'Start each day with intention',
  'daily', true, true, true, true,
  1, 'orange', 'landscape', 'never'
);

-- Insert the 5 tasks for this routine
DO $$
DECLARE
  routine_uuid uuid;
BEGIN
  SELECT id INTO routine_uuid FROM routines_bank WHERE title = 'Daily Reset' ORDER BY created_at DESC LIMIT 1;

  INSERT INTO routines_bank_tasks (routine_id, title, emoji, schedule_days, task_order, is_once, duration_minutes)
  VALUES
    (routine_uuid, 'Open the app', '📱', ARRAY[0,1,2,3,4,5,6], 0, false, null),
    (routine_uuid, 'Check in with your mood', '🌤️', ARRAY[0,1,2,3,4,5,6], 1, false, 1),
    (routine_uuid, 'Breathing exercise', '🫁', ARRAY[0,1,2,3,4,5,6], 2, false, 2),
    (routine_uuid, 'Write a short reflection', '📝', ARRAY[0,1,2,3,4,5,6], 3, false, 3),
    (routine_uuid, 'Complete one small task', '✅', ARRAY[0,1,2,3,4,5,6], 4, false, null);
END $$;