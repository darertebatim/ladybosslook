
-- Add schedule_type to routine_plans (daily = all tasks every day, weekly = weekday-based, challenge = sequential drip)
ALTER TABLE public.routine_plans 
ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'daily';

-- Add scheduling columns to routine_plan_tasks
ALTER TABLE public.routine_plan_tasks 
ADD COLUMN schedule_days INTEGER[] DEFAULT '{}',
ADD COLUMN drip_day INTEGER DEFAULT NULL;

-- Add started_at to user_routine_plans for challenge drip calculation
ALTER TABLE public.user_routine_plans 
ADD COLUMN started_at TIMESTAMPTZ DEFAULT now();

-- Add round_id to routine_plans for cohort-linked challenges
ALTER TABLE public.routine_plans
ADD COLUMN linked_round_id UUID REFERENCES public.program_rounds(id) DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.routine_plans.schedule_type IS 'daily = all tasks every day, weekly = tasks assigned to specific weekdays, challenge = sequential drip (day 1, day 2, etc.)';
COMMENT ON COLUMN public.routine_plan_tasks.schedule_days IS 'For weekly mode: array of weekday numbers (0=Sun, 1=Mon, ..., 6=Sat)';
COMMENT ON COLUMN public.routine_plan_tasks.drip_day IS 'For challenge mode: which day number this task appears on (1-based)';
COMMENT ON COLUMN public.user_routine_plans.started_at IS 'When the user added this ritual - used as Day 1 for challenge drip calculations';
