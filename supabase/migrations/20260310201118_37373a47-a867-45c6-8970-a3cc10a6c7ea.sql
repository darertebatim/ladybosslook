
-- Step 1: Link routine_bank_tasks that already have a matching title in admin_task_bank
UPDATE routines_bank_tasks rbt
SET task_id = atb.id
FROM admin_task_bank atb
WHERE lower(atb.title) = lower(rbt.title)
  AND rbt.task_id IS NULL;

-- Step 2: Insert missing tasks into admin_task_bank and link back
WITH new_tasks AS (
  INSERT INTO admin_task_bank (
    title, emoji, category, color, duration_minutes,
    repeat_pattern, repeat_days, sort_order, is_active, is_popular,
    goal_enabled, reminder_enabled
  )
  SELECT DISTINCT ON (lower(rbt.title))
    rbt.title,
    COALESCE(rbt.emoji, '✨'),
    COALESCE(rb.category, 'general'),
    COALESCE(rb.color, 'purple'),
    COALESCE(rbt.duration_minutes, 1),
    CASE 
      WHEN rbt.is_once = true THEN 'none'
      WHEN rbt.schedule_days IS NOT NULL AND array_length(rbt.schedule_days, 1) = 7 THEN 'daily'
      WHEN rbt.schedule_days IS NOT NULL AND array_length(rbt.schedule_days, 1) > 0 THEN 'weekly'
      ELSE 'daily'
    END,
    rbt.schedule_days,
    row_number() OVER (ORDER BY rb.category, rbt.task_order) + 103,
    true,
    false,
    false,
    false
  FROM routines_bank_tasks rbt
  JOIN routines_bank rb ON rb.id = rbt.routine_id
  WHERE rb.is_active = true
    AND rbt.task_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM admin_task_bank atb WHERE lower(atb.title) = lower(rbt.title)
    )
  ORDER BY lower(rbt.title), rbt.created_at
  RETURNING id, title
)
UPDATE routines_bank_tasks rbt
SET task_id = nt.id
FROM new_tasks nt
WHERE lower(rbt.title) = lower(nt.title)
  AND rbt.task_id IS NULL;
