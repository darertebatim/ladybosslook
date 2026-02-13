ALTER TABLE public.user_tasks DROP CONSTRAINT user_tasks_pro_link_type_check;
ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check CHECK (
  pro_link_type IS NULL OR pro_link_type = ANY (ARRAY['playlist','journal','channel','program','planner','inspire','route','breathe','water','period','emotion','audio','mood','fasting','weight'])
);