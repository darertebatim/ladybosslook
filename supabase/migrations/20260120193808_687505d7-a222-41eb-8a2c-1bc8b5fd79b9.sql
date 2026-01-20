-- Add is_popular column to task_templates
ALTER TABLE public.task_templates 
ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT false;

-- Add is_popular column to routine_task_templates (Pro Task Templates)
ALTER TABLE public.routine_task_templates 
ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT false;