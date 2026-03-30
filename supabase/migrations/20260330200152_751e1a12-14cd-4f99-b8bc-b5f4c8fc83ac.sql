-- Reset all users' recovery shield counts so everyone starts fresh
-- Free users get 1 shield, Pro users get 3 shields (handled by app logic)
UPDATE public.user_streaks 
SET streak_recovery_count = 0, 
    streak_recovery_used = false, 
    streak_recovery_used_at = NULL;