-- Remove server-side schedules that are now handled by local notifications
DELETE FROM push_notification_schedules 
WHERE name IN ('Time Period Reminders', 'Goal Nudges', 'Morning Summary', 'Evening Check-in');

-- Keep only server-side schedules that need database calculations:
-- - Momentum Celebration (needs active days count)
-- - Daily Completion (needs task completion count) 
-- - Goal Milestones (triggered locally, but keep for admin visibility)
-- - Drip Content, Session Reminders, Feed Posts, Weekly Summary (existing)