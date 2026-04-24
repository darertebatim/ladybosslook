
-- 1) Fix the bad source row so future client-side adds also work
UPDATE public.admin_task_bank
SET pro_link_type = 'route',
    pro_link_value = '/app/tasksbank'
WHERE id = 'b2ae1ed7-5164-4cc2-b594-eaf2fbb73615'
  AND pro_link_type = 'tasksbank';

-- 2) Harden the provisioning function: validate pro_link_type against the
--    same allow-list as the user_tasks CHECK constraint, and replace any
--    invalid value with NULL so a bad task can never abort the whole insert.
CREATE OR REPLACE FUNCTION public.provision_daily_reset_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_routine_id constant uuid := '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';
  v_routine record;
  v_start_order int;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
  v_color_cycle constant text[] := ARRAY['sky','mint','lavender','pink','lime','yellow','peach'];
  v_valid_pro_link_types constant text[] := ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_routine','focus_timer',
    'routine','reading','reading_item'
  ];
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
      -- normalize pro_link_type: keep only allow-listed values, else NULL
      CASE
        WHEN atb.pro_link_type = ANY (v_valid_pro_link_types) THEN atb.pro_link_type
        ELSE NULL
      END AS pro_link_type_safe,
      atb.pro_link_value AS atb_pro_link_value
    FROM ordered_tasks ot
    LEFT JOIN public.admin_task_bank atb ON atb.id = ot.task_id
  )
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
  FROM resolved r;

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
$$;

-- 3) Re-run the backfill now that the data is clean and the function is hardened
DO $$
DECLARE
  v_user_id uuid;
  v_count int := 0;
  v_failed int := 0;
BEGIN
  FOR v_user_id IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_routines_bank b
      WHERE b.user_id = u.id
        AND b.routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
    )
  LOOP
    BEGIN
      PERFORM public.provision_daily_reset_for_user(v_user_id);
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE NOTICE 'Backfill failed for %: % - %', v_user_id, SQLSTATE, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Daily Reset backfill v2: provisioned=%, failed=%', v_count, v_failed;
END $$;
