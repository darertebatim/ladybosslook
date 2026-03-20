-- Add user_task_id column to link routine session tasks to user_tasks
ALTER TABLE public.routine_session_tasks 
ADD COLUMN IF NOT EXISTS user_task_id uuid REFERENCES public.user_tasks(id) ON DELETE SET NULL;

-- Create index for querying task duration history
CREATE INDEX IF NOT EXISTS idx_routine_session_tasks_user_task_id 
ON public.routine_session_tasks(user_task_id) WHERE user_task_id IS NOT NULL;