-- Test: Virtually attribute test user to instructor Ali Lotfi
DO $$
DECLARE
  v_user_id uuid := '6c5f9bde-058e-4c50-b807-fbe58d962b73';
  v_instructor_id uuid := '67e63d2c-04d9-4ec7-be3e-1c42d6d45c0c';
  v_instructor_slug text := 'ali';
  v_program_slug text := 'goalsettingfa';
  v_routine_id uuid := 'dc57a895-1e86-4a9c-b5a5-e6e165be0959';
  v_playlist_id uuid := 'ef8c782e-575b-40a6-bfc5-1040c7f71f4c';
  v_program_title text;
BEGIN
  -- 1. Create the referral record (idempotent via unique constraint)
  INSERT INTO public.instructor_referrals (user_id, instructor_id, attribution_source, raw_attribution)
  VALUES (
    v_user_id,
    v_instructor_id,
    'manual_admin_test',
    jsonb_build_object('source', 'manual_admin_test', 'slug', v_instructor_slug, 'note', 'Virtually added via admin for QA test of instructor referral feature')
  )
  ON CONFLICT (user_id, instructor_id) DO NOTHING;

  -- 2. Tag profile
  UPDATE public.profiles
  SET referred_by_instructor_id = v_instructor_id
  WHERE id = v_user_id;

  -- 3. Auto-enroll in default program (if not already enrolled)
  SELECT title INTO v_program_title FROM public.program_catalog WHERE slug = v_program_slug;

  INSERT INTO public.course_enrollments (user_id, program_slug, course_name, status)
  SELECT v_user_id, v_program_slug, COALESCE(v_program_title, v_program_slug), 'active'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE user_id = v_user_id AND program_slug = v_program_slug
  );

  -- 4. Add default routine to user's bank
  INSERT INTO public.user_routines_bank (user_id, routine_id, added_at)
  SELECT v_user_id, v_routine_id, now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_routines_bank
    WHERE user_id = v_user_id AND routine_id = v_routine_id
  );

  -- 5. Unlock default playlist (free access via playlist_saves)
  INSERT INTO public.playlist_saves (user_id, playlist_id)
  SELECT v_user_id, v_playlist_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.playlist_saves
    WHERE user_id = v_user_id AND playlist_id = v_playlist_id
  );

  -- Note: Plus trial skipped (Ali has plus_trial_days = 0)
END $$;