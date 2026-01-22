-- Create table to track sent task reminders (prevent duplicates)
CREATE TABLE public.task_reminder_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, reminder_date)
);

-- Enable RLS
ALTER TABLE public.task_reminder_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own reminder logs
CREATE POLICY "Users can view their own reminder logs"
ON public.task_reminder_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role can insert reminder logs"
ON public.task_reminder_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Index for fast lookup
CREATE INDEX idx_task_reminder_logs_lookup 
ON public.task_reminder_logs (task_id, reminder_date);

-- Clean up old logs automatically (older than 30 days)
CREATE INDEX idx_task_reminder_logs_sent_at 
ON public.task_reminder_logs (sent_at);