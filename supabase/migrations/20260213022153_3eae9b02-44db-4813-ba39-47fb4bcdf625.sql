-- Add streak_goal_completed_at to track when a user completes their streak goal challenge
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS streak_goal_completed_at TIMESTAMPTZ DEFAULT NULL;