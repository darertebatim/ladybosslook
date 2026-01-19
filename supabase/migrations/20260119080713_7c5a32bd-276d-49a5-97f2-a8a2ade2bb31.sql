-- Create table for tracking program event completions in the planner
CREATE TABLE public.planner_program_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('session', 'module', 'track')),
  event_id UUID NOT NULL,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type, event_id, completed_date)
);

-- Enable RLS
ALTER TABLE public.planner_program_completions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own completions
CREATE POLICY "Users can view their own completions"
ON public.planner_program_completions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert their own completions"
ON public.planner_program_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own completions
CREATE POLICY "Users can delete their own completions"
ON public.planner_program_completions
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient queries by user and date
CREATE INDEX idx_planner_program_completions_user_date 
ON public.planner_program_completions(user_id, completed_date);