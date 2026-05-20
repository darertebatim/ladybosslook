DO $$
DECLARE
  v_legacy text[] := ARRAY['Self-Care Gap Plan','My Self-Care Routine','روتین خودمراقبتی من'];
  r record;
  v_target uuid;
BEGIN
  -- 1. Rename all existing 'My Rilo' routines globally
  UPDATE public.user_routines_bank
  SET title = 'My Rilo Self Care', emoji = '🔥', color = 'pink'
  WHERE title = 'My Rilo';

  UPDATE public.user_tasks
  SET title = 'My Rilo Self Care', tag = 'My Rilo Self Care', emoji = '🔥', color = 'pink'
  WHERE pro_link_type = 'routine' AND title = 'My Rilo';

  -- 2. Per user, consolidate legacy self-care routines into a single My Rilo Self Care
  FOR r IN
    SELECT DISTINCT user_id FROM public.user_routines_bank WHERE title = ANY(v_legacy)
  LOOP
    SELECT routine_id INTO v_target
    FROM public.user_routines_bank
    WHERE user_id = r.user_id AND title = 'My Rilo Self Care'
    ORDER BY routine_id LIMIT 1;

    IF v_target IS NULL THEN
      -- Promote the first legacy routine to become My Rilo Self Care
      SELECT routine_id INTO v_target
      FROM public.user_routines_bank
      WHERE user_id = r.user_id AND title = ANY(v_legacy)
      ORDER BY routine_id LIMIT 1;

      UPDATE public.user_routines_bank
      SET title = 'My Rilo Self Care', emoji = '🔥', color = 'pink'
      WHERE user_id = r.user_id AND routine_id = v_target;

      UPDATE public.user_tasks
      SET title = 'My Rilo Self Care', tag = 'My Rilo Self Care', emoji = '🔥', color = 'pink'
      WHERE user_id = r.user_id
        AND pro_link_type = 'routine'
        AND pro_link_value = v_target::text;
    END IF;

    -- Reparent tasks from other legacy routines to the target
    UPDATE public.user_tasks
    SET source_routine_id = v_target
    WHERE user_id = r.user_id
      AND source_routine_id IN (
        SELECT routine_id FROM public.user_routines_bank
        WHERE user_id = r.user_id AND title = ANY(v_legacy) AND routine_id <> v_target
      );

    -- Delete launcher tasks for the other legacy routines
    DELETE FROM public.user_tasks
    WHERE user_id = r.user_id
      AND pro_link_type = 'routine'
      AND pro_link_value IN (
        SELECT routine_id::text FROM public.user_routines_bank
        WHERE user_id = r.user_id AND title = ANY(v_legacy) AND routine_id <> v_target
      );

    -- Delete the (now empty) other legacy routine rows
    DELETE FROM public.user_routines_bank
    WHERE user_id = r.user_id
      AND title = ANY(v_legacy)
      AND routine_id <> v_target;
  END LOOP;
END $$;