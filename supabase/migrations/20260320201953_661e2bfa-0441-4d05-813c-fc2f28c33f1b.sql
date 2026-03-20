-- Update admin_task_bank: move goal_target (seconds) to duration_minutes, then clear goal fields
-- Only for tasks linked to focus-category routines
UPDATE admin_task_bank
SET 
  duration_minutes = goal_target / 60,
  goal_enabled = false,
  goal_target = NULL,
  goal_type = NULL,
  goal_unit = NULL
WHERE id IN (
  SELECT DISTINCT rbt.task_id 
  FROM routines_bank_tasks rbt 
  JOIN routines_bank rb ON rb.id = rbt.routine_id 
  WHERE rb.category ILIKE '%focus%' 
    AND rbt.task_id IS NOT NULL
)
AND goal_enabled = true 
AND goal_type = 'timer';

-- Also update routines_bank_tasks duration_minutes to match
UPDATE routines_bank_tasks
SET duration_minutes = (
  SELECT atb.duration_minutes 
  FROM admin_task_bank atb 
  WHERE atb.id = routines_bank_tasks.task_id
)
WHERE task_id IS NOT NULL
AND routine_id IN (
  SELECT id FROM routines_bank WHERE category ILIKE '%focus%'
);