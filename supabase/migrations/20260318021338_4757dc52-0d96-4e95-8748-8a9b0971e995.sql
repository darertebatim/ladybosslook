-- Update pro_link_type check constraints to include focus_routine and focus_timer

ALTER TABLE public.user_tasks DROP CONSTRAINT user_tasks_pro_link_type_check;
ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_routine','focus_timer'
  ]));

ALTER TABLE public.routine_plan_tasks DROP CONSTRAINT routine_plan_tasks_pro_link_type_check;
ALTER TABLE public.routine_plan_tasks ADD CONSTRAINT routine_plan_tasks_pro_link_type_check
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_routine','focus_timer'
  ]));

ALTER TABLE public.admin_task_bank DROP CONSTRAINT admin_task_bank_pro_link_type_check;
ALTER TABLE public.admin_task_bank ADD CONSTRAINT admin_task_bank_pro_link_type_check
  CHECK (pro_link_type IS NULL OR pro_link_type = ANY (ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_routine','focus_timer'
  ]));