-- Fix orphaned routine tasks: set source_routine_id for user_tasks
-- that match routines_bank_tasks by title for active user_routines_bank entries
UPDATE user_tasks ut
SET source_routine_id = urb.routine_id
FROM user_routines_bank urb
JOIN routines_bank_tasks rbt ON rbt.routine_id = urb.routine_id
WHERE ut.user_id = urb.user_id
  AND ut.title = rbt.title
  AND ut.source_routine_id IS NULL
  AND ut.is_active = true
  AND urb.is_active = true;

-- Clean up the helper function
DROP FUNCTION IF EXISTS public.fix_orphaned_routine_tasks();