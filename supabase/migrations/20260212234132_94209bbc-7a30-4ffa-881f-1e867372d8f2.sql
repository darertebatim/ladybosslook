-- Fix the broken Ladyboss Workout Plan tasks for this user
UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[1],
  scheduled_date = '2026-02-16'
WHERE id = '34eb0bea-e6c4-496b-9767-f9b119e3be24';

UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[2],
  scheduled_date = '2026-02-16'
WHERE id = 'fdd4e1ee-cc7d-4d9d-bb92-4d5413fb5d8e';

UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[4],
  scheduled_date = '2026-02-16'
WHERE id = '7ed0af43-dd93-4679-8b5f-de2a09b8284b';

UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[5],
  scheduled_date = '2026-02-16'
WHERE id = '120aa1a6-1884-457c-82b6-ee2d17e239e6';

UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[6],
  scheduled_date = '2026-02-16'
WHERE id = '5bc6cbed-ccdf-4bc0-ae23-5394998e5735';

UPDATE public.user_tasks SET 
  repeat_pattern = 'weekly',
  repeat_days = ARRAY[3],
  scheduled_date = '2026-02-16'
WHERE id = '173bcc08-ff3e-40a1-84be-6578fc0ec3bc';