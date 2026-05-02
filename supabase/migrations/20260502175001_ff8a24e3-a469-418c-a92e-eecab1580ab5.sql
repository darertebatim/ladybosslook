-- Reset all users' used recovery shield count to 0 so existing users get a
-- fresh start under the new earned-shields system (Day 1/7/30 milestones).
-- Anyone with longest_streak >= 1 will now have at least 1 shield available.
UPDATE public.user_streaks
SET streak_recovery_count = 0
WHERE streak_recovery_count > 0;