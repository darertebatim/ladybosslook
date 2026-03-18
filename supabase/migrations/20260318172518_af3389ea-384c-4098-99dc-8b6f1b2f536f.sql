-- Backfill existing user_routines_bank records from routines_bank
UPDATE public.user_routines_bank urb
SET
  title = rb.title,
  emoji = rb.emoji,
  cover_image_url = rb.cover_image_url,
  category = rb.category,
  color = rb.color,
  schedule_type = COALESCE(rb.schedule_type, 'daily'),
  is_focus = COALESCE(rb.is_focus, false)
FROM public.routines_bank rb
WHERE urb.routine_id = rb.id
  AND urb.title IS NULL;

-- Backfill source_routine_id on user_tasks for existing routine tasks
UPDATE public.user_tasks ut
SET source_routine_id = matched.routine_id
FROM (
  SELECT DISTINCT ON (ut2.id) ut2.id AS task_id, rbt.routine_id
  FROM public.user_tasks ut2
  JOIN public.user_routines_bank urb ON urb.user_id = ut2.user_id AND urb.is_active = true
  JOIN public.routines_bank_tasks rbt ON rbt.routine_id = urb.routine_id AND rbt.title = ut2.title
  WHERE ut2.source_routine_id IS NULL
    AND ut2.is_active = true
) matched
WHERE ut.id = matched.task_id;