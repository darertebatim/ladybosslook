
ALTER TABLE public.admin_task_bank DROP CONSTRAINT admin_task_bank_pro_link_type_check;

ALTER TABLE public.admin_task_bank ADD CONSTRAINT admin_task_bank_pro_link_type_check
CHECK (
  pro_link_type IS NULL OR pro_link_type = ANY (ARRAY[
    'playlist','journal','channel','program','planner','inspire','route',
    'breathe','water','period','emotion','audio','mood','fasting','weight',
    'reflection','video','video_playlist','focus_routine','focus_timer',
    'routine','reading','reading_item',
    'tasksbank','myprograms','myprofile','presence','listen','watch','myroutines','projects'
  ])
);
