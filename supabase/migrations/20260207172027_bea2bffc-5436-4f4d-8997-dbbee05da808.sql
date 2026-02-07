-- Add gold streak tracking columns to user_streaks table
-- Gold streak tracks consecutive days with 100% task completion (gold badge)
ALTER TABLE user_streaks 
ADD COLUMN IF NOT EXISTS current_gold_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_gold_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_gold_date date DEFAULT NULL;