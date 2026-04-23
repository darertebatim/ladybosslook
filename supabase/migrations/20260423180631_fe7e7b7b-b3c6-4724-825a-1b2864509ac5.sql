-- Track when a user has been granted the one-time Plus trial (across all instructors)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plus_trial_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_trial_granted_by_instructor_id uuid REFERENCES public.instructors(id);

-- Allow stacking: drop unique constraint on (user_id) for instructor_referrals if any,
-- and ensure uniqueness is per (user_id, instructor_id) so the same instructor can't double-apply
-- but different instructors can stack.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'instructor_referrals_user_instructor_unique'
  ) THEN
    ALTER TABLE public.instructor_referrals
      ADD CONSTRAINT instructor_referrals_user_instructor_unique UNIQUE (user_id, instructor_id);
  END IF;
END$$;