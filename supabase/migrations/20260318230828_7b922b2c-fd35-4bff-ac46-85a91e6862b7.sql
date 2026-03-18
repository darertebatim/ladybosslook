-- Create a helper function to fix orphaned routine tasks
-- This fixes tasks that were created without source_routine_id
CREATE OR REPLACE FUNCTION public.fix_orphaned_routine_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For each user_routines_bank entry, find matching user_tasks by title
  -- and set source_routine_id if null
  UPDATE user_tasks ut
  SET source_routine_id = urb.routine_id
  FROM user_routines_bank urb
  JOIN routines_bank_tasks rbt ON rbt.routine_id = urb.routine_id
  WHERE ut.user_id = urb.user_id
    AND ut.title = rbt.title
    AND ut.source_routine_id IS NULL
    AND ut.is_active = true
    AND urb.is_active = true;
END;
$$;