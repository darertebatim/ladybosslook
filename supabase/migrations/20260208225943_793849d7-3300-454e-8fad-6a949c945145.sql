-- Drop the existing constraints
ALTER TABLE user_tasks DROP CONSTRAINT IF EXISTS user_tasks_pro_link_type_check;
ALTER TABLE routine_plan_tasks DROP CONSTRAINT IF EXISTS routine_plan_tasks_pro_link_type_check;
ALTER TABLE admin_task_bank DROP CONSTRAINT IF EXISTS admin_task_bank_pro_link_type_check;

-- Re-create with 'mood' included
ALTER TABLE user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check 
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY['playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water', 'period', 'emotion', 'audio', 'mood']));

ALTER TABLE routine_plan_tasks ADD CONSTRAINT routine_plan_tasks_pro_link_type_check 
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY['playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water', 'period', 'emotion', 'audio', 'mood']));

ALTER TABLE admin_task_bank ADD CONSTRAINT admin_task_bank_pro_link_type_check 
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY['playlist', 'journal', 'channel', 'program', 'planner', 'inspire', 'route', 'breathe', 'water', 'period', 'emotion', 'audio', 'mood']));