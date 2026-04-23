DO $$
DECLARE
  v_user_id uuid := '5c478b96-5b50-4adb-be73-3cd0e13145ed';
  v_instructor_id uuid := '67e63d2c-04d9-4ec7-be3e-1c42d6d45c0c';
  v_program_slug text := 'goalsettingfa';
  v_program_title text := 'Goal Setting (FA) By Ali Lotfi';
  v_playlist_id uuid := 'ef8c782e-575b-40a6-bfc5-1040c7f71f4c';
  v_channel_id uuid := 'b03e41fe-79f4-4226-a950-3123d67c1880';
BEGIN
  UPDATE public.profiles
  SET referred_by_instructor_id = v_instructor_id
  WHERE id = v_user_id;

  INSERT INTO public.instructor_referrals (user_id, instructor_id, attribution_source, raw_attribution)
  SELECT v_user_id, v_instructor_id, 'manual', jsonb_build_object('source', 'manual_admin_repair', 'slug', 'ali')
  WHERE NOT EXISTS (
    SELECT 1 FROM public.instructor_referrals
    WHERE user_id = v_user_id AND instructor_id = v_instructor_id
  );

  INSERT INTO public.course_enrollments (user_id, program_slug, course_name, status)
  SELECT v_user_id, v_program_slug, v_program_title, 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = v_user_id AND program_slug = v_program_slug
  );

  INSERT INTO public.playlist_saves (user_id, playlist_id)
  SELECT v_user_id, v_playlist_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.playlist_saves
    WHERE user_id = v_user_id AND playlist_id = v_playlist_id
  );

  DELETE FROM public.feed_channel_exclusions
  WHERE user_id = v_user_id AND channel_id = v_channel_id;

  INSERT INTO public.user_routines_bank (
    user_id, routine_id, title, emoji, category, color, schedule_type, is_focus, is_active, is_user_created
  )
  SELECT
    v_user_id,
    rb.id,
    rb.title,
    rb.emoji,
    rb.category,
    rb.color,
    rb.schedule_type,
    rb.is_focus,
    true,
    false
  FROM public.routines_bank rb
  WHERE rb.id IN (
    'dc57a895-1e86-4a9c-b5a5-e6e165be0959',
    '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_routines_bank urb
    WHERE urb.user_id = v_user_id AND urb.routine_id = rb.id
  );

  WITH current_max AS (
    SELECT COALESCE(MAX(order_index), -1) AS max_order
    FROM public.user_tasks
    WHERE user_id = v_user_id
  ),
  desired_tasks AS (
    SELECT
      rb.id AS routine_id,
      rb.category AS routine_category,
      rbt.task_order,
      rbt.title,
      COALESCE(rbt.emoji, atb.emoji, rb.emoji, '✨') AS emoji,
      COALESCE(atb.color, rb.color, 'yellow') AS color,
      CASE
        WHEN rbt.is_once THEN 'none'
        ELSE COALESCE(atb.repeat_pattern, 'daily')
      END AS repeat_pattern,
      CASE
        WHEN rbt.is_once THEN CURRENT_DATE
        ELSE NULL
      END AS scheduled_date,
      CASE
        WHEN rbt.is_once THEN NULL
        ELSE atb.repeat_days
      END AS repeat_days,
      CASE
        WHEN atb.pro_link_type = 'tasksbank' THEN 'route'
        ELSE atb.pro_link_type
      END AS pro_link_type,
      CASE
        WHEN atb.pro_link_type = 'tasksbank' THEN '/app/tasksbank'
        WHEN atb.pro_link_type = 'playlist' THEN COALESCE(atb.pro_link_value, atb.linked_playlist_id::text)
        ELSE COALESCE(atb.pro_link_value, atb.linked_playlist_id::text)
      END AS pro_link_value,
      CASE
        WHEN atb.pro_link_type = 'playlist' THEN atb.linked_playlist_id
        ELSE NULL
      END AS linked_playlist_id,
      atb.goal_enabled,
      atb.goal_target,
      atb.goal_type,
      atb.goal_unit,
      atb.time_period,
      atb.duration_minutes
    FROM public.routines_bank rb
    JOIN public.routines_bank_tasks rbt ON rbt.routine_id = rb.id
    LEFT JOIN public.admin_task_bank atb ON atb.id = rbt.task_id
    WHERE rb.id IN (
      'dc57a895-1e86-4a9c-b5a5-e6e165be0959',
      '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
    )
  ),
  missing_tasks AS (
    SELECT dt.*
    FROM desired_tasks dt
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_tasks ut
      WHERE ut.user_id = v_user_id
        AND ut.source_routine_id = dt.routine_id
        AND ut.title = dt.title
    )
  ),
  numbered_tasks AS (
    SELECT
      mt.*,
      ROW_NUMBER() OVER (ORDER BY mt.routine_id, mt.task_order, mt.title) - 1 AS row_offset
    FROM missing_tasks mt
  )
  INSERT INTO public.user_tasks (
    user_id,
    title,
    emoji,
    color,
    scheduled_date,
    repeat_pattern,
    repeat_days,
    tag,
    order_index,
    is_active,
    linked_playlist_id,
    pro_link_type,
    pro_link_value,
    goal_enabled,
    goal_type,
    goal_target,
    goal_unit,
    time_period,
    source_routine_id,
    duration_minutes
  )
  SELECT
    v_user_id,
    nt.title,
    nt.emoji,
    nt.color,
    nt.scheduled_date,
    nt.repeat_pattern,
    nt.repeat_days,
    nt.routine_category,
    cm.max_order + 1 + nt.row_offset,
    true,
    nt.linked_playlist_id,
    nt.pro_link_type,
    nt.pro_link_value,
    COALESCE(nt.goal_enabled, false),
    nt.goal_type,
    nt.goal_target,
    nt.goal_unit,
    nt.time_period,
    nt.routine_id,
    nt.duration_minutes
  FROM numbered_tasks nt
  CROSS JOIN current_max cm;
END $$;