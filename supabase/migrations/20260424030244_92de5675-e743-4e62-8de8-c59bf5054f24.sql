
DO $$
DECLARE
  v_user_id uuid;
  v_total_attempted int := 0;
  v_bank_before int;
  v_bank_after int;
  v_tasks_before int;
  v_tasks_after int;
  v_first_user uuid;
BEGIN
  -- Snapshot before
  SELECT COUNT(*) INTO v_bank_before FROM public.user_routines_bank
   WHERE routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';
  SELECT COUNT(*) INTO v_tasks_before FROM public.user_tasks
   WHERE source_routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';

  -- Pick first missing user for a focused trace
  SELECT u.id INTO v_first_user
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_routines_bank b
    WHERE b.user_id = u.id
      AND b.routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
  )
  LIMIT 1;

  RAISE NOTICE '=== BEFORE: bank=%, tasks=%, first_missing_user=%',
    v_bank_before, v_tasks_before, v_first_user;

  -- Run the backfill
  FOR v_user_id IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_routines_bank b
      WHERE b.user_id = u.id
        AND b.routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
    )
  LOOP
    v_total_attempted := v_total_attempted + 1;
    BEGIN
      PERFORM public.provision_daily_reset_for_user(v_user_id);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed for %: % - %', v_user_id, SQLSTATE, SQLERRM;
    END;
  END LOOP;

  -- Snapshot after
  SELECT COUNT(*) INTO v_bank_after FROM public.user_routines_bank
   WHERE routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';
  SELECT COUNT(*) INTO v_tasks_after FROM public.user_tasks
   WHERE source_routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';

  RAISE NOTICE '=== AFTER: bank=% (delta %), tasks=% (delta %), attempted=%',
    v_bank_after, v_bank_after - v_bank_before,
    v_tasks_after, v_tasks_after - v_tasks_before,
    v_total_attempted;
END $$;
