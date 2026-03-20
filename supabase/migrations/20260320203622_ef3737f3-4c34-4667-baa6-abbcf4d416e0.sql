
-- Update routine_categories: rename Focus → Reset in both slug and name
-- The cascade_category_slug_update trigger will auto-update admin_task_bank and routines_bank

UPDATE routine_categories SET slug = 'Morning-Reset', name = 'Morning Reset' WHERE slug = 'Morning-Focus';
UPDATE routine_categories SET slug = 'Evening-Reset', name = 'Evening Reset' WHERE slug = 'Evening-Focus';
UPDATE routine_categories SET slug = 'Productivity-Reset', name = 'Productivity Reset' WHERE slug = 'Productivity-Focus';
UPDATE routine_categories SET slug = 'Health-Reset', name = 'Health Reset' WHERE slug = 'Health-Focus';
UPDATE routine_categories SET slug = 'Relationship-Reset', name = 'Relationship Reset' WHERE slug = 'Relationship-Focus';
UPDATE routine_categories SET slug = 'Pets-Reset', name = 'Pets Reset' WHERE slug = 'Pets-Focus';
UPDATE routine_categories SET slug = 'The-Famous-Reset', name = 'The Famous Reset' WHERE slug = 'The-Famous-Focus';
UPDATE routine_categories SET slug = 'Sos-Reset', name = 'Sos Reset' WHERE slug = 'Sos-Focus';

-- Also update user_routines_bank which isn't covered by the cascade trigger
UPDATE user_routines_bank SET category = 'Morning-Reset' WHERE category = 'Morning-Focus';
UPDATE user_routines_bank SET category = 'Evening-Reset' WHERE category = 'Evening-Focus';
UPDATE user_routines_bank SET category = 'Productivity-Reset' WHERE category = 'Productivity-Focus';
UPDATE user_routines_bank SET category = 'Health-Reset' WHERE category = 'Health-Focus';
UPDATE user_routines_bank SET category = 'Relationship-Reset' WHERE category = 'Relationship-Focus';
UPDATE user_routines_bank SET category = 'Pets-Reset' WHERE category = 'Pets-Focus';
UPDATE user_routines_bank SET category = 'The-Famous-Reset' WHERE category = 'The-Famous-Focus';
UPDATE user_routines_bank SET category = 'Sos-Reset' WHERE category = 'Sos-Focus';

-- Also update user_tasks tags that reference these categories
UPDATE user_tasks SET tag = 'Morning-Reset' WHERE tag = 'Morning-Focus';
UPDATE user_tasks SET tag = 'Evening-Reset' WHERE tag = 'Evening-Focus';
UPDATE user_tasks SET tag = 'Productivity-Reset' WHERE tag = 'Productivity-Focus';
UPDATE user_tasks SET tag = 'Health-Reset' WHERE tag = 'Health-Focus';
UPDATE user_tasks SET tag = 'Relationship-Reset' WHERE tag = 'Relationship-Focus';
UPDATE user_tasks SET tag = 'Pets-Reset' WHERE tag = 'Pets-Focus';
UPDATE user_tasks SET tag = 'The-Famous-Reset' WHERE tag = 'The-Famous-Focus';
UPDATE user_tasks SET tag = 'Sos-Reset' WHERE tag = 'Sos-Focus';
