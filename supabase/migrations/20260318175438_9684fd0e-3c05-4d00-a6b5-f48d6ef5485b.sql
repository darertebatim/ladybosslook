-- Clean up today's focus routine sessions and their task records
DELETE FROM public.routine_session_tasks 
WHERE session_id IN (
  SELECT id FROM public.routine_sessions 
  WHERE started_at >= CURRENT_DATE
);

DELETE FROM public.routine_sessions 
WHERE started_at >= CURRENT_DATE;

-- Also clean today's task_completions for focus routine tasks 
-- so percentages start fresh
DELETE FROM public.task_completions 
WHERE completed_date = CURRENT_DATE 
AND task_id IN (
  SELECT ut.id FROM public.user_tasks ut
  JOIN public.user_routines_bank urb ON urb.routine_id = ut.source_routine_id AND urb.user_id = ut.user_id
  WHERE urb.is_focus = true
);