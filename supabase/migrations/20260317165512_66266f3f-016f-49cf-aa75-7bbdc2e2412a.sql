
-- Add project step tracking to user_tasks
ALTER TABLE public.user_tasks
ADD COLUMN source_routine_id uuid DEFAULT NULL,
ADD COLUMN project_step integer DEFAULT NULL;

-- Add current step tracking to user_routines_bank
ALTER TABLE public.user_routines_bank
ADD COLUMN current_step integer DEFAULT 1;

-- Index for efficient lookups
CREATE INDEX idx_user_tasks_source_routine ON public.user_tasks (user_id, source_routine_id) WHERE source_routine_id IS NOT NULL;
