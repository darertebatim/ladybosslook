-- Add UPDATE policy for task_completions so users can update their goal_progress
CREATE POLICY "Users can update their own task completions"
ON public.task_completions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);