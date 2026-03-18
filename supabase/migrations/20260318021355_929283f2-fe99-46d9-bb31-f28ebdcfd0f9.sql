-- Backfill missing parent pro-linked tasks for existing activated focus routines
INSERT INTO public.user_tasks (user_id, title, emoji, color, repeat_pattern, repeat_days, tag, pro_link_type, pro_link_value, is_active, order_index, goal_enabled, goal_type, goal_unit)
SELECT
  urb.user_id,
  rb.title,
  COALESCE(rb.emoji, '🎯'),
  'amber',
  'daily',
  ARRAY[1,2,3,4,5],
  'pro',
  'focus_routine',
  urb.routine_id::text,
  true,
  999,
  true,
  'timer',
  'minutes'
FROM public.user_routines_bank urb
JOIN public.routines_bank rb ON rb.id = urb.routine_id
WHERE rb.is_focus = true
  AND urb.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tasks ut
    WHERE ut.user_id = urb.user_id
      AND ut.pro_link_type = 'focus_routine'
      AND ut.pro_link_value = urb.routine_id::text
  );