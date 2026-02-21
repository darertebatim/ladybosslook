
-- Revert: Restore Calm Breathing and Stretch back to one-time actions as intended
UPDATE admin_task_bank SET repeat_pattern = 'none' WHERE id IN (
  '9ff53dfd-5050-4364-883d-f05b1cbb96aa',  -- Calm Breathing
  'cee28027-aae8-4858-8fcb-78767b23831a'   -- Stretch
);

-- Revert user tasks back to one-time with today's date
UPDATE user_tasks SET repeat_pattern = 'none', scheduled_date = '2026-02-21' 
WHERE title IN ('Calm Breathing', 'Stretch') 
AND created_at > '2026-02-21 03:00:00';
