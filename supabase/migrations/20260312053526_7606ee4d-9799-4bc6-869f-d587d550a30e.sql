
-- Update routines_bank: title
UPDATE routines_bank SET title = REPLACE(REPLACE(title, 'Rituals', 'Routines'), 'Ritual', 'Routine')
WHERE title ILIKE '%ritual%';

-- Update routines_bank: subtitle
UPDATE routines_bank SET subtitle = REPLACE(REPLACE(subtitle, 'Rituals', 'Routines'), 'Ritual', 'Routine')
WHERE subtitle ILIKE '%ritual%';

-- Update routines_bank: description
UPDATE routines_bank SET description = REPLACE(REPLACE(description, 'Rituals', 'Routines'), 'Ritual', 'Routine')
WHERE description ILIKE '%ritual%';

-- Update admin_task_bank: title
UPDATE admin_task_bank SET title = REPLACE(REPLACE(title, 'Rituals', 'Routines'), 'Ritual', 'Routine')
WHERE title ILIKE '%ritual%';

-- Update admin_task_bank: description
UPDATE admin_task_bank SET description = REPLACE(REPLACE(description, 'Rituals', 'Routines'), 'Ritual', 'Routine')
WHERE description ILIKE '%ritual%';
