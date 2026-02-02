-- Update user_tasks constraint to include 'emotion'
ALTER TABLE public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_pro_link_type_check;
ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN (
  'playlist', 'journal', 'channel', 'program', 'planner', 
  'inspire', 'route', 'breathe', 'water', 'period', 'emotion'
));

-- Update routine_plan_tasks constraint to include 'emotion'
ALTER TABLE public.routine_plan_tasks DROP CONSTRAINT IF EXISTS routine_plan_tasks_pro_link_type_check;
ALTER TABLE public.routine_plan_tasks ADD CONSTRAINT routine_plan_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN (
  'playlist', 'journal', 'channel', 'program', 'planner', 
  'inspire', 'route', 'breathe', 'water', 'period', 'emotion'
));