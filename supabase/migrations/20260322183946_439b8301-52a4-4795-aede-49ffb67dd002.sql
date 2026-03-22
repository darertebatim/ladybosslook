ALTER TABLE public.planner_program_completions
DROP CONSTRAINT IF EXISTS planner_program_completions_event_type_check;

ALTER TABLE public.planner_program_completions
ADD CONSTRAINT planner_program_completions_event_type_check
CHECK (event_type = ANY (ARRAY['session'::text, 'module'::text, 'track'::text, 'enrollment'::text]));