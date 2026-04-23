DO $$
DECLARE
  v_user_id uuid := '6c5f9bde-058e-4c50-b807-fbe58d962b73';
  v_routine_id uuid := 'dc57a895-1e86-4a9c-b5a5-e6e165be0959';
  v_routine record;
  v_task record;
  v_start_order int;
  v_index int := 0;
  v_colors text[] := ARRAY['coral','peach','rose','lavender','sky','mint','lime'];
  v_bank record;
  v_pro_link_value text;
  v_linked_playlist uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM user_tasks WHERE user_id = v_user_id AND source_routine_id = v_routine_id
  ) THEN
    RAISE NOTICE 'Planner tasks already exist; skipping';
    RETURN;
  END IF;

  SELECT * INTO v_routine FROM routines_bank WHERE id = v_routine_id;

  SELECT COALESCE(MAX(order_index), -1) + 1 INTO v_start_order
  FROM user_tasks WHERE user_id = v_user_id;

  FOR v_task IN
    SELECT * FROM routines_bank_tasks
    WHERE routine_id = v_routine_id
    ORDER BY task_order ASC
  LOOP
    SELECT pro_link_type, pro_link_value, linked_playlist_id, color, time_period,
           goal_enabled, goal_target, goal_type, goal_unit,
           repeat_pattern, repeat_days, duration_minutes
    INTO v_bank
    FROM admin_task_bank WHERE id = v_task.task_id;

    v_pro_link_value := COALESCE(v_bank.pro_link_value, v_bank.linked_playlist_id::text);
    v_linked_playlist := CASE
      WHEN v_bank.pro_link_type = 'playlist' THEN
        COALESCE(NULLIF(v_bank.pro_link_value,'')::uuid, v_bank.linked_playlist_id)
      ELSE NULL
    END;

    INSERT INTO user_tasks (
      user_id, title, emoji, color, repeat_pattern, repeat_days,
      scheduled_date, tag, time_period,
      linked_playlist_id, pro_link_type, pro_link_value,
      is_active, order_index,
      goal_enabled, goal_target, goal_type, goal_unit,
      duration_minutes, source_routine_id
    ) VALUES (
      v_user_id,
      v_task.title,
      COALESCE(v_task.emoji, v_routine.emoji, '✨'),
      COALESCE(v_bank.color, v_colors[(v_index % array_length(v_colors,1)) + 1]),
      COALESCE(v_bank.repeat_pattern, 'daily'),
      v_bank.repeat_days,
      NULL,
      v_routine.category,
      v_bank.time_period,
      v_linked_playlist,
      v_bank.pro_link_type,
      v_pro_link_value,
      true,
      v_start_order + v_index,
      COALESCE(v_bank.goal_enabled, false),
      v_bank.goal_target,
      v_bank.goal_type,
      v_bank.goal_unit,
      v_bank.duration_minutes,
      v_routine_id
    );
    v_index := v_index + 1;
  END LOOP;

  INSERT INTO user_tasks (
    user_id, title, emoji, color, repeat_pattern, tag,
    pro_link_type, pro_link_value, is_active, order_index, source_routine_id
  ) VALUES (
    v_user_id, v_routine.title, '🎬', 'mint', 'daily',
    v_routine.category, 'routine', v_routine_id::text,
    true, v_start_order + v_index, NULL
  );

  UPDATE user_routines_bank
  SET is_active = true,
      title = v_routine.title,
      emoji = v_routine.emoji,
      cover_image_url = v_routine.cover_image_url,
      category = v_routine.category,
      color = v_routine.color,
      schedule_type = COALESCE(v_routine.schedule_type, 'daily'),
      is_focus = COALESCE(v_routine.is_focus, false)
  WHERE user_id = v_user_id AND routine_id = v_routine_id;
END $$;