-- Add streak goal columns to user_streaks table
ALTER TABLE user_streaks 
ADD COLUMN IF NOT EXISTS streak_goal integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS streak_goal_set_at timestamp with time zone DEFAULT NULL;