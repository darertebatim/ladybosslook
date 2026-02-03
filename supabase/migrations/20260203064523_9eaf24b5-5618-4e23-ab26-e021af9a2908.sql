-- Update routine_categories: change slug from inner-strength to strength
UPDATE routine_categories 
SET slug = 'strength', name = 'Strength'
WHERE slug = 'inner-strength';

-- Update all tasks in admin_task_bank to use the new category slug
UPDATE admin_task_bank 
SET category = 'strength'
WHERE category = 'inner-strength';