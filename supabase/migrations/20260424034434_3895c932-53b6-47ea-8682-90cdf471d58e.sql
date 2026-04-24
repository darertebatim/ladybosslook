-- Fix provision_daily_reset_for_user and provision_routine_for_user:
-- 1. Expand pro_link_type allow-list to match src/lib/proTaskTypes.ts
-- 2. Add routine launcher pro-task creation (was missing)

CREATE OR REPLACE FUNCTION public.provision_daily_reset_for_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_routine_id constant uuid := '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';
  v_routine record;
  v_start_order int;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_color_cycle constant text[] := ARRAY['sky','mint','lavender','pink','lime','yellow','peach'];
  v_valid_pro_link_types constant text[] := ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_timer','routine',
    'myprograms','myprofile','presence','tasksbank','listen','watch',
    'myroutines','projects','reading','reading_item'
  ];
  v_inserted_count int := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_routines_bank
    WHERE user_id = p_user_id AND routine_id = v_routine_id
  ) THEN
    RETURN;
  END IF;

  SELECT id, title, emoji, color, category, cover_image_url, schedule_type, is_focus
    INTO v_routine
  FROM public.routines_bank
  WHERE id = v_routine_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Daily Reset routine % not found — skipping', v_routine_id;
    RETURN;
  END IF;

  SELECT COALESCE(MAX(order_index), -1) + 1
    INTO v_start_order
  FROM public.user_tasks
  WHERE user_id = p_user_id;

  WITH ordered_tasks AS (
    SELECT
      rbt.id,
      rbt.title,
      rbt.emoji,
      rbt.task_id,
      rbt.is_once,
      rbt.monthly_day,
      ROW_NUMBER() OVER (ORDER BY rbt.task_order, rbt.id) - 1 AS idx
    FROM public.routines_bank_tasks rbt
    WHERE rbt.routine_id = v_routine_id
  ),
  resolved AS (
    SELECT
      ot.*,
      atb.color AS atb_color,
      atb.repeat_pattern AS atb_repeat_pattern,
      atb.repeat_days AS atb_repeat_days,
      atb.time_period AS atb_time_period,
      atb.linked_playlist_id AS atb_linked_playlist_id,
      atb.duration_minutes AS atb_duration_minutes,
      atb.goal_enabled AS atb_goal_enabled,
      atb.goal_target AS atb_goal_target,
      atb.goal_type AS atb_goal_type,
      atb.goal_unit AS atb_goal_unit,
      CASE
        WHEN atb.pro_link_type = ANY (v_valid_pro_link_types) THEN atb.pro_link_type
        ELSE NULL
      END AS pro_link_type_safe,
      atb.pro_link_value AS atb_pro_link_value
    FROM ordered_tasks ot
    LEFT JOIN public.admin_task_bank atb ON atb.id = ot.task_id
  ),
  inserted AS (
    INSERT INTO public.user_tasks (
      user_id, title, emoji, color, repeat_pattern, repeat_days,
      scheduled_date, scheduled_time, tag, time_period,
      linked_playlist_id, pro_link_type, pro_link_value,
      is_active, order_index,
      goal_enabled, goal_target, goal_type, goal_unit,
      duration_minutes, source_routine_id
    )
    SELECT
      p_user_id,
      r.title,
      COALESCE(r.emoji, v_routine.emoji, '✨'),
      COALESCE(r.atb_color, v_color_cycle[(r.idx % array_length(v_color_cycle, 1)) + 1]),
      CASE
        WHEN r.is_once THEN 'none'
        WHEN r.monthly_day IS NOT NULL THEN 'monthly'
        ELSE COALESCE(r.atb_repeat_pattern, 'daily')
      END,
      CASE
        WHEN r.is_once OR r.monthly_day IS NOT NULL THEN NULL
        ELSE r.atb_repeat_days
      END,
      CASE
        WHEN r.is_once THEN v_today
        WHEN r.monthly_day IS NOT NULL THEN
          CASE
            WHEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day) >= v_today
              THEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day)
            ELSE (make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day) + INTERVAL '1 month')::date
          END
        WHEN COALESCE(r.atb_repeat_pattern, 'daily') = 'none' THEN v_today
        ELSE NULL
      END,
      NULL,
      v_routine.category,
      r.atb_time_period,
      CASE WHEN r.pro_link_type_safe = 'playlist'
           THEN COALESCE(r.atb_pro_link_value::uuid, r.atb_linked_playlist_id)
           ELSE NULL END,
      r.pro_link_type_safe,
      CASE WHEN r.pro_link_type_safe IS NULL THEN NULL
           ELSE COALESCE(r.atb_pro_link_value, r.atb_linked_playlist_id::text)
      END,
      true,
      v_start_order + r.idx,
      COALESCE(r.atb_goal_enabled, false),
      r.atb_goal_target,
      r.atb_goal_type,
      r.atb_goal_unit,
      r.atb_duration_minutes,
      v_routine_id
    FROM resolved r
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted_count FROM inserted;

  -- Insert the routine launcher pro-task (so it appears in "Routines" pill on Home)
  -- source_routine_id is NULL on the launcher (matches useRoutinesBank.tsx convention)
  INSERT INTO public.user_tasks (
    user_id, title, emoji, color, repeat_pattern,
    tag, pro_link_type, pro_link_value,
    is_active, order_index, source_routine_id
  )
  VALUES (
    p_user_id,
    v_routine.title,
    COALESCE(v_routine.emoji, '🎬'),
    COALESCE(v_routine.color, 'mint'),
    'daily',
    v_routine.category,
    'routine',
    v_routine_id::text,
    true,
    v_start_order + v_inserted_count,
    NULL
  );

  INSERT INTO public.user_routines_bank (
    user_id, routine_id, is_active,
    title, emoji, cover_image_url, category, color,
    schedule_type, is_focus
  )
  VALUES (
    p_user_id, v_routine_id, true,
    v_routine.title, v_routine.emoji, v_routine.cover_image_url,
    v_routine.category, v_routine.color,
    v_routine.schedule_type, COALESCE(v_routine.is_focus, false)
  )
  ON CONFLICT (user_id, routine_id) DO NOTHING;
END;
$function$;


CREATE OR REPLACE FUNCTION public.provision_routine_for_user(p_user_id uuid, p_routine_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_routine record;
  v_start_order int;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_task_count int := 0;
  v_color_cycle constant text[] := ARRAY['sky','mint','lavender','pink','lime','yellow','peach'];
  v_valid_pro_link_types constant text[] := ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_timer','routine',
    'myprograms','myprofile','presence','tasksbank','listen','watch',
    'myroutines','projects','reading','reading_item'
  ];
  v_program_slug text;
  v_program_title text;
  v_round_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_routines_bank
    WHERE user_id = p_user_id AND routine_id = p_routine_id
  ) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_added');
  END IF;

  SELECT id, title, emoji, color, category, cover_image_url, schedule_type,
         is_focus, linked_program_slug
    INTO v_routine
  FROM public.routines_bank
  WHERE id = p_routine_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'routine_not_found');
  END IF;

  SELECT COALESCE(MAX(order_index), -1) + 1
    INTO v_start_order
  FROM public.user_tasks
  WHERE user_id = p_user_id;

  WITH ordered_tasks AS (
    SELECT
      rbt.id,
      rbt.title,
      rbt.emoji,
      rbt.task_id,
      rbt.is_once,
      rbt.monthly_day,
      ROW_NUMBER() OVER (ORDER BY rbt.task_order, rbt.id) - 1 AS idx
    FROM public.routines_bank_tasks rbt
    WHERE rbt.routine_id = p_routine_id
  ),
  resolved AS (
    SELECT
      ot.*,
      atb.color AS atb_color,
      atb.repeat_pattern AS atb_repeat_pattern,
      atb.repeat_days AS atb_repeat_days,
      atb.time_period AS atb_time_period,
      atb.linked_playlist_id AS atb_linked_playlist_id,
      atb.duration_minutes AS atb_duration_minutes,
      atb.goal_enabled AS atb_goal_enabled,
      atb.goal_target AS atb_goal_target,
      atb.goal_type AS atb_goal_type,
      atb.goal_unit AS atb_goal_unit,
      CASE
        WHEN atb.pro_link_type = ANY (v_valid_pro_link_types) THEN atb.pro_link_type
        ELSE NULL
      END AS pro_link_type_safe,
      atb.pro_link_value AS atb_pro_link_value
    FROM ordered_tasks ot
    LEFT JOIN public.admin_task_bank atb ON atb.id = ot.task_id
  ),
  inserted AS (
    INSERT INTO public.user_tasks (
      user_id, title, emoji, color, repeat_pattern, repeat_days,
      scheduled_date, scheduled_time, tag, time_period,
      linked_playlist_id, pro_link_type, pro_link_value,
      is_active, order_index,
      goal_enabled, goal_target, goal_type, goal_unit,
      duration_minutes, source_routine_id
    )
    SELECT
      p_user_id,
      r.title,
      COALESCE(r.emoji, v_routine.emoji, '✨'),
      COALESCE(r.atb_color, v_color_cycle[(r.idx % array_length(v_color_cycle, 1)) + 1]),
      CASE
        WHEN r.is_once THEN 'none'
        WHEN r.monthly_day IS NOT NULL THEN 'monthly'
        ELSE COALESCE(r.atb_repeat_pattern, 'daily')
      END,
      CASE
        WHEN r.is_once OR r.monthly_day IS NOT NULL THEN NULL
        ELSE r.atb_repeat_days
      END,
      CASE
        WHEN r.is_once THEN v_today
        WHEN r.monthly_day IS NOT NULL THEN
          CASE
            WHEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day) >= v_today
              THEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day)
            ELSE (make_date(extract(year from v_today)::int, extract(month from v_today)::int, r.monthly_day) + INTERVAL '1 month')::date
          END
        WHEN COALESCE(r.atb_repeat_pattern, 'daily') = 'none' THEN v_today
        ELSE NULL
      END,
      NULL,
      v_routine.category,
      r.atb_time_period,
      CASE WHEN r.pro_link_type_safe = 'playlist'
           THEN COALESCE(r.atb_pro_link_value::uuid, r.atb_linked_playlist_id)
           ELSE NULL END,
      r.pro_link_type_safe,
      CASE WHEN r.pro_link_type_safe IS NULL THEN NULL
           ELSE COALESCE(r.atb_pro_link_value, r.atb_linked_playlist_id::text)
      END,
      true,
      v_start_order + r.idx,
      COALESCE(r.atb_goal_enabled, false),
      r.atb_goal_target,
      r.atb_goal_type,
      r.atb_goal_unit,
      r.atb_duration_minutes,
      p_routine_id
    FROM resolved r
    RETURNING 1
  )
  SELECT count(*) INTO v_task_count FROM inserted;

  -- Insert routine launcher pro-task (source_routine_id NULL by convention)
  INSERT INTO public.user_tasks (
    user_id, title, emoji, color, repeat_pattern,
    tag, pro_link_type, pro_link_value,
    is_active, order_index, source_routine_id
  )
  VALUES (
    p_user_id,
    v_routine.title,
    COALESCE(v_routine.emoji, '🎬'),
    COALESCE(v_routine.color, 'mint'),
    'daily',
    v_routine.category,
    'routine',
    p_routine_id::text,
    true,
    v_start_order + v_task_count,
    NULL
  );

  INSERT INTO public.user_routines_bank (
    user_id, routine_id, is_active,
    title, emoji, cover_image_url, category, color,
    schedule_type, is_focus
  )
  VALUES (
    p_user_id, p_routine_id, true,
    v_routine.title, v_routine.emoji, v_routine.cover_image_url,
    v_routine.category, v_routine.color,
    v_routine.schedule_type, COALESCE(v_routine.is_focus, false)
  )
  ON CONFLICT (user_id, routine_id) DO NOTHING;

  IF v_routine.schedule_type = 'program' AND v_routine.linked_program_slug IS NOT NULL THEN
    v_program_slug := v_routine.linked_program_slug;

    IF NOT EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE user_id = p_user_id
        AND program_slug = v_program_slug
        AND status = 'active'
    ) THEN
      SELECT round_id INTO v_round_id
      FROM public.program_auto_enrollment
      WHERE program_slug = v_program_slug
      LIMIT 1;

      IF v_round_id IS NULL THEN
        SELECT id INTO v_round_id
        FROM public.program_rounds
        WHERE program_slug = v_program_slug AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
      END IF;

      SELECT title INTO v_program_title
      FROM public.program_catalog
      WHERE slug = v_program_slug;

      INSERT INTO public.course_enrollments (
        user_id, program_slug, course_name, round_id, status
      ) VALUES (
        p_user_id, v_program_slug,
        COALESCE(v_program_title, v_program_slug),
        v_round_id, 'active'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'task_count', v_task_count,
    'routine_id', p_routine_id
  );
END;
$function$;