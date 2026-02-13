
-- Create app_return_events table to track individual app returns
CREATE TABLE public.app_return_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add index for efficient querying by user and date
CREATE INDEX idx_app_return_events_user_created 
  ON public.app_return_events (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.app_return_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own return events
CREATE POLICY "Users can insert own return events"
  ON public.app_return_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own return events
CREATE POLICY "Users can read own return events"
  ON public.app_return_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all return events"
  ON public.app_return_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
