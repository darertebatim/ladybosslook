
-- =============================================================
-- Server-side provisioning of the "Daily Reset" routine
-- =============================================================

-- Function that mirrors addRoutineToUserPlanner() from the client,
-- but specialised for the Daily Reset routine (schedule_type='daily',
-- no challenge/project/monthly logic needed).
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
BEGIN
  -- Skip if user already has the routine in their bank
  IF EXISTS (
    SELECT 1 FROM public.user_routines_bank
    WHERE user_id = p_user_id AND routine_id = v_routine_id
  ) THEN
    RETURN;
  END IF;

  -- Load routine metadata
  SELECT id, title, emoji, color, category, cover_image_url, schedule_type, is_focus
    INTO v_routine
  FROM public.routines_bank
  WHERE id = v_routine_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'Daily Reset routine % not found — skipping', v_routine_id;
    RETURN;
  END IF;

  -- Compute starting order_index (continue after user's existing tasks)
  SELECT COALESCE(MAX(order_index), -1) + 1
    INTO v_start_order
  FROM public.user_tasks
  WHERE user_id = p_user_id;

  -- Insert the routine's tasks into user_tasks.
  -- Mirrors the "Normal routines" branch of addRoutineToUserPlanner:
  --   - is_once=true       -> repeat_pattern='none', scheduled_date=today
  --   - monthly_day        -> repeat_pattern='monthly' (none in Daily Reset, but kept for safety)
  --   - default            -> repeat from admin_task_bank (or 'daily')
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
    ot.title,
    COALESCE(ot.emoji, v_routine.emoji, '✨'),
    COALESCE(atb.color, v_color_cycle[(ot.idx % array_length(v_color_cycle, 1)) + 1]),
    -- repeat_pattern
    CASE
      WHEN ot.is_once THEN 'none'
      WHEN ot.monthly_day IS NOT NULL THEN 'monthly'
      ELSE COALESCE(atb.repeat_pattern, 'daily')
    END,
    -- repeat_days
    CASE
      WHEN ot.is_once OR ot.monthly_day IS NOT NULL THEN NULL
      ELSE atb.repeat_days
    END,
    -- scheduled_date
    CASE
      WHEN ot.is_once THEN v_today
      WHEN ot.monthly_day IS NOT NULL THEN
        CASE
          WHEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, ot.monthly_day) >= v_today
            THEN make_date(extract(year from v_today)::int, extract(month from v_today)::int, ot.monthly_day)
          ELSE (make_date(extract(year from v_today)::int, extract(month from v_today)::int, ot.monthly_day) + INTERVAL '1 month')::date
        END
      WHEN COALESCE(atb.repeat_pattern, 'daily') = 'none' THEN v_today
      ELSE NULL
    END,
    NULL,                              -- scheduled_time
    v_routine.category,                -- tag = routine category
    atb.time_period,
    -- linked_playlist_id only if pro_link_type='playlist'
    CASE WHEN atb.pro_link_type = 'playlist'
         THEN COALESCE(atb.pro_link_value::uuid, atb.linked_playlist_id)
         ELSE NULL END,
    atb.pro_link_type,
    COALESCE(atb.pro_link_value, atb.linked_playlist_id::text),
    true,                              -- is_active
    v_start_order + ot.idx,
    COALESCE(atb.goal_enabled, false),
    atb.goal_target,
    atb.goal_type,
    atb.goal_unit,
    atb.duration_minutes,
    v_routine_id
  FROM ordered_tasks ot
  LEFT JOIN public.admin_task_bank atb ON atb.id = ot.task_id;

  -- Track the routine in user_routines_bank so it shows in My Routines and the Routine Player
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

-- =============================================================
-- Trigger: assign Daily Reset to every new signup
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_default_routine()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Wrapped in BEGIN/EXCEPTION so a provisioning failure can never block signup
  BEGIN
    PERFORM public.provision_daily_reset_for_user(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'provision_daily_reset_for_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_default_routine ON auth.users;
CREATE TRIGGER on_auth_user_created_default_routine
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_default_routine();

-- =============================================================
-- One-time backfill for all existing users who don't have it
-- =============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_count int := 0;
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
      RAISE NOTICE 'Backfill failed for %: %', v_user_id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Daily Reset backfill complete — provisioned for % users', v_count;
END $$;
