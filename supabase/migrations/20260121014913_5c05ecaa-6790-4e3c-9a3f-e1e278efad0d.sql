-- Allow multiple enrollments per program for different rounds
-- Current unique constraint prevents enrolling a user into more than one round per program

ALTER TABLE public.course_enrollments
  DROP CONSTRAINT IF EXISTS course_enrollments_user_id_course_name_key;

-- One enrollment per (user, program, round) when round_id exists
CREATE UNIQUE INDEX IF NOT EXISTS course_enrollments_unique_round_enrollment
  ON public.course_enrollments (user_id, program_slug, round_id)
  WHERE round_id IS NOT NULL;

-- One self-paced enrollment per (user, program) when round_id is NULL
CREATE UNIQUE INDEX IF NOT EXISTS course_enrollments_unique_selfpaced_enrollment
  ON public.course_enrollments (user_id, program_slug)
  WHERE round_id IS NULL;