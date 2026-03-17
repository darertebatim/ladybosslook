
DO $$
DECLARE
  rec RECORD;
  v_bank_id uuid;
BEGIN
  -- STEP 1: Fix already-synced tasks - update duration and goal fields from routines_bank_tasks
  UPDATE admin_task_bank atb
  SET 
    duration_minutes = rbt.duration_minutes,
    goal_enabled = true,
    goal_type = 'timer',
    goal_target = rbt.duration_minutes * 60
  FROM routines_bank_tasks rbt
  INNER JOIN routines_bank rb ON rb.id = rbt.routine_id
  WHERE rbt.task_id = atb.id
    AND rb.is_focus = true
    AND rbt.duration_minutes IS NOT NULL
    AND rbt.duration_minutes > 0;

  -- STEP 2: Sync all unlinked tasks (task_id IS NULL) from focus routines
  FOR rec IN
    SELECT rbt.id as rbt_id, rbt.title, rbt.emoji, rbt.duration_minutes, rbt.schedule_days,
           rb.category, rb.color
    FROM routines_bank_tasks rbt
    INNER JOIN routines_bank rb ON rb.id = rbt.routine_id
    WHERE rb.is_focus = true AND rbt.task_id IS NULL
  LOOP
    INSERT INTO admin_task_bank (
      title, emoji, category, color, 
      repeat_pattern, repeat_days,
      duration_minutes, goal_enabled, goal_type, goal_target,
      is_active, is_popular, sort_order
    ) VALUES (
      rec.title,
      COALESCE(rec.emoji, '📝'),
      COALESCE(rec.category, 'general'),
      COALESCE(rec.color, 'sky'),
      CASE 
        WHEN rec.schedule_days IS NOT NULL AND array_length(rec.schedule_days, 1) = 7 THEN 'daily'
        WHEN rec.schedule_days IS NOT NULL AND array_length(rec.schedule_days, 1) > 0 THEN 'weekly'
        ELSE 'daily'
      END,
      CASE 
        WHEN rec.schedule_days IS NOT NULL AND array_length(rec.schedule_days, 1) > 0 AND array_length(rec.schedule_days, 1) < 7 THEN rec.schedule_days
        ELSE NULL
      END,
      rec.duration_minutes,
      CASE WHEN rec.duration_minutes > 0 THEN true ELSE false END,
      CASE WHEN rec.duration_minutes > 0 THEN 'timer' ELSE NULL END,
      CASE WHEN rec.duration_minutes > 0 THEN rec.duration_minutes * 60 ELSE NULL END,
      true, false, 0
    )
    RETURNING id INTO v_bank_id;

    -- Link the routine task to the new bank entry
    UPDATE routines_bank_tasks SET task_id = v_bank_id WHERE id = rec.rbt_id;
  END LOOP;
END;
$$;
