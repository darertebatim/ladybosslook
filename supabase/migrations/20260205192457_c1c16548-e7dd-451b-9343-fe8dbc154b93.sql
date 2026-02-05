-- Normalize category names to lowercase with dashes (the standard format used in routine_categories)
UPDATE admin_task_bank SET category = 'easy-win' WHERE category = 'Easy Win';
UPDATE admin_task_bank SET category = 'calm' WHERE category = 'Calm';
UPDATE admin_task_bank SET category = 'gratitude' WHERE category = 'Gratitude';
UPDATE admin_task_bank SET category = 'hygiene' WHERE category = 'Hygiene';
UPDATE admin_task_bank SET category = 'movement' WHERE category = 'Movement';
UPDATE admin_task_bank SET category = 'nutrition' WHERE category = 'Nutrition';
UPDATE admin_task_bank SET category = 'pro' WHERE category = 'Pro';
UPDATE admin_task_bank SET category = 'sleep' WHERE category = 'Sleep';
UPDATE admin_task_bank SET category = 'strength' WHERE category = 'Strength';
UPDATE admin_task_bank SET category = 'connection' WHERE category = 'Connection';
UPDATE admin_task_bank SET category = 'productivity' WHERE category = 'Productivity';
UPDATE admin_task_bank SET category = 'self-kindness' WHERE category = 'Self-Kindness';