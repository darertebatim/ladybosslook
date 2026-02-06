-- Drop existing check constraint and recreate with 'audio' included
ALTER TABLE public.user_tasks 
DROP CONSTRAINT IF EXISTS user_tasks_pro_link_type_check;

ALTER TABLE public.user_tasks
ADD CONSTRAINT user_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN ('playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water', 'period', 'emotion', 'audio'));

-- Also update admin_task_bank if it has the same constraint
ALTER TABLE public.admin_task_bank 
DROP CONSTRAINT IF EXISTS admin_task_bank_pro_link_type_check;

ALTER TABLE public.admin_task_bank
ADD CONSTRAINT admin_task_bank_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN ('playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water', 'period', 'emotion', 'audio'));