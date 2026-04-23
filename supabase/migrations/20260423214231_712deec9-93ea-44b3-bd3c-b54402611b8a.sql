-- Roll back the partial setup so the client-side flow can re-run cleanly.
-- Keep referred_by_instructor_id on the profile as the trigger.
DELETE FROM public.instructor_referrals
  WHERE user_id='5c478b96-5b50-4adb-be73-3cd0e13145ed'
    AND instructor_id='67e63d2c-04d9-4ec7-be3e-1c42d6d45c0c';

DELETE FROM public.course_enrollments
  WHERE user_id='5c478b96-5b50-4adb-be73-3cd0e13145ed'
    AND program_slug='goalsettingfa';

DELETE FROM public.user_routines_bank
  WHERE user_id='5c478b96-5b50-4adb-be73-3cd0e13145ed'
    AND routine_id='dc57a895-1e86-4a9c-b5a5-e6e165be0959';

DELETE FROM public.playlist_saves
  WHERE user_id='5c478b96-5b50-4adb-be73-3cd0e13145ed'
    AND playlist_id='ef8c782e-575b-40a6-bfc5-1040c7f71f4c';