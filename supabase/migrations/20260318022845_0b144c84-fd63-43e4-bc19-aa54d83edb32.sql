-- Remove duplicate pro-linked focus_routine tasks, keeping only the oldest one per (user_id, pro_link_value)
DELETE FROM public.user_tasks
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY user_id, pro_link_value ORDER BY created_at ASC) AS rn
    FROM public.user_tasks
    WHERE pro_link_type = 'focus_routine'
  ) ranked
  WHERE rn > 1
);