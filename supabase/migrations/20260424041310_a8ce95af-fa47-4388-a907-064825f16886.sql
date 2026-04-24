UPDATE public.user_tasks
SET scheduled_date = '2026-04-23'
WHERE user_id = (SELECT id FROM auth.users WHERE email='test8apr23@ladybosslook.com')
  AND repeat_pattern = 'none'
  AND scheduled_date = '2026-04-24'
  AND source_routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6';