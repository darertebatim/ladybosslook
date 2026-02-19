
-- Add streak recovery tracking to user_streaks
ALTER TABLE public.user_streaks 
  ADD COLUMN IF NOT EXISTS streak_recovery_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS streak_recovery_used_at timestamp with time zone;
