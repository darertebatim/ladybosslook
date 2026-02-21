
-- Fix existing user tasks for Calm Breathing and Stretch to be daily
UPDATE user_tasks SET repeat_pattern = 'daily', scheduled_date = NULL 
WHERE title IN ('Calm Breathing', 'Stretch') 
AND repeat_pattern = 'none'
AND created_at > '2026-02-21 03:00:00';
