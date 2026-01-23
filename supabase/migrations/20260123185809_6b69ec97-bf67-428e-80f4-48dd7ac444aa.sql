-- Add is_urgent column to user_tasks for urgent alarm feature
ALTER TABLE public.user_tasks
ADD COLUMN is_urgent BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_tasks.is_urgent IS 'When true, task reminder creates a native calendar alarm that bypasses silent mode';