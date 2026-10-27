DROP TRIGGER IF EXISTS on_auth_user_created_default_routine ON auth.users;

UPDATE public.user_tasks SET is_active = false
WHERE is_active = true
  AND (source_routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'
       OR (pro_link_type = 'routine' AND pro_link_value = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6'));

UPDATE public.user_routines_bank SET is_active = false
WHERE routine_id = '6c2d0492-9310-46a2-99ad-be5c2ddbc3f6' AND is_active = true;