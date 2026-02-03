-- Create task_skips table for tracking skipped and snoozed tasks
CREATE TABLE public.task_skips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  skipped_date DATE NOT NULL,
  snoozed_to_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate skips
CREATE UNIQUE INDEX task_skips_task_date_unique ON public.task_skips(task_id, skipped_date);

-- Create index for efficient querying
CREATE INDEX task_skips_user_date_idx ON public.task_skips(user_id, skipped_date);

-- Enable RLS
ALTER TABLE public.task_skips ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own task skips"
ON public.task_skips FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task skips"
ON public.task_skips FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task skips"
ON public.task_skips FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task skips"
ON public.task_skips FOR DELETE
USING (auth.uid() = user_id);