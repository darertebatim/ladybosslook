-- Backfill missing routine launcher pro-task for everyone who has Daily Reset 
-- in their user_routines_bank but lacks the launcher user_task entry.
INSERT INTO public.user_tasks (
  user_id, title, emoji, color, repeat_pattern, tag,
  pro_link_type, pro_link_value, is_active, order_index, source_routine_id
)
SELECT
  urb.user_id,
  COALESCE(rb.title, 'Daily Reset'),
  COALESCE(rb.emoji, '🎬'),
  COALESCE(rb.color, 'mint'),
  'daily',
  rb.category,
  'routine',
  urb.routine_id::text,
  true,
  COALESCE(
    (SELECT MAX(order_index) FROM public.user_tasks WHERE user_id = urb.user_id),
    -1
  ) + 1,
  NULL
FROM public.user_routines_bank urb
JOIN public.routines_bank rb ON rb.id = urb.routine_id
WHERE urb.routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_tasks ut
    WHERE ut.user_id = urb.user_id
      AND ut.pro_link_type = 'routine'
      AND ut.pro_link_value = urb.routine_id::text
  );