-- Restore gold streak for user alilotfihami@gmail.com
-- Their longest_gold_streak is 6 but current was reset to 1 by a race condition
UPDATE user_streaks 
SET current_gold_streak = 6
WHERE user_id = 'bce7b2e1-e60a-45d6-a172-264755a6627b';