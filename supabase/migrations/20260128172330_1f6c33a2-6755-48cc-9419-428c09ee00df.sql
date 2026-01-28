-- Add goal tracking fields to user_tasks
ALTER TABLE public.user_tasks 
ADD COLUMN goal_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN goal_type text CHECK (goal_type IN ('timer', 'count')),
ADD COLUMN goal_target integer,
ADD COLUMN goal_unit text;

-- Add goal progress tracking to task_completions
ALTER TABLE public.task_completions
ADD COLUMN goal_progress integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.user_tasks.goal_enabled IS 'Whether this task has a goal tracking feature enabled';
COMMENT ON COLUMN public.user_tasks.goal_type IS 'Type of goal: timer (seconds) or count (number of times)';
COMMENT ON COLUMN public.user_tasks.goal_target IS 'Target value for the goal (seconds for timer, count for count type)';
COMMENT ON COLUMN public.user_tasks.goal_unit IS 'Unit for count type goals (times, glasses, pages, etc.)';
COMMENT ON COLUMN public.task_completions.goal_progress IS 'Current progress towards the goal for this date';