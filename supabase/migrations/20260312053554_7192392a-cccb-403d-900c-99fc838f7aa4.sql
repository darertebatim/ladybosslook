
UPDATE routines_bank SET description = REPLACE(REPLACE(description, 'rituals', 'routines'), 'ritual', 'routine')
WHERE description ILIKE '%ritual%';
