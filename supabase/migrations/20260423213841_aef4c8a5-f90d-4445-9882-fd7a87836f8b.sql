-- Backfill: assign test2apr23 user to Ali Lotfi's referral and apply default setup
DO $$
DECLARE
  v_user_id uuid := '5c478b96-5b50-4adb-be73-3cd0e13145ed';
  v_instructor_id uuid := '67e63d2c-04d9-4ec7-be3e-1c42d6d45c0c';
  v_program_slug text := 'goalsettingfa';
  v_routine_id uuid := 'dc57a895-1e86-4a9c-b5a5-e6e165be0959';
  v_playlist_id uuid := 'ef8c782e-575b-40a6-bfc5-1040c7f71f4c';
  v_channel_id uuid := 'b03e41fe-79f4-4226-a950-3123d67c1880';
  v_program_title text;
BEGIN
  -- 1. Create referral record (idempotent)
  INSERT INTO public.instructor_referrals (user_id, instructor_id, attribution_source, raw_attribution)
  VALUES (v_user_id, v_instructor_id, 'manual', jsonb_build_object('source', 'manual_admin_assign', 'slug', 'ali'))
  ON CONFLICT (user_id, instructor_id) DO NOTHING;

  -- 2. Tag profile
  UPDATE public.profiles
  SET referred_by_instructor_id = v_instructor_id
  WHERE id = v_user_id;

  -- 3. Auto-enroll in default program
  SELECT title INTO v_program_title FROM public.program_catalog WHERE slug = v_program_slug;
  IF v_program_title IS NULL THEN v_program_title := v_program_slug; END IF;

  INSERT INTO public.course_enrollments (user_id, program_slug, course_name, status)
  SELECT v_user_id, v_program_slug, v_program_title, 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = v_user_id AND program_slug = v_program_slug
  );

  -- 4. Add default routine to user_routines_bank
  INSERT INTO public.user_routines_bank (user_id, routine_id)
  SELECT v_user_id, v_routine_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_routines_bank
    WHERE user_id = v_user_id AND routine_id = v_routine_id
  );

  -- 5. Unlock default playlist via playlist_saves
  INSERT INTO public.playlist_saves (user_id, playlist_id)
  SELECT v_user_id, v_playlist_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.playlist_saves
    WHERE user_id = v_user_id AND playlist_id = v_playlist_id
  );

  -- 6. Auto-join channel (remove any exclusion)
  DELETE FROM public.feed_channel_exclusions
  WHERE user_id = v_user_id AND channel_id = v_channel_id;

  RAISE NOTICE 'Backfill complete for test2apr23@ladybosslook.com → Ali Lotfi';
END $$;