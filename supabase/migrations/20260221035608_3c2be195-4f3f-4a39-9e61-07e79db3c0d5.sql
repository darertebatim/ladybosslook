
-- Fix Calm Breathing and Stretch to be daily repeating (they were incorrectly set to 'none')
UPDATE admin_task_bank SET repeat_pattern = 'daily' WHERE id IN (
  '9ff53dfd-5050-4364-883d-f05b1cbb96aa',  -- Calm Breathing
  'cee28027-aae8-4858-8fcb-78767b23831a'   -- Stretch
);
