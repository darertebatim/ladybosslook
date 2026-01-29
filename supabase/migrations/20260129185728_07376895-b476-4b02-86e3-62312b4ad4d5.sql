-- Update the pro_link_type check constraint to include 'water'
ALTER TABLE public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_pro_link_type_check;

ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN ('playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water'));