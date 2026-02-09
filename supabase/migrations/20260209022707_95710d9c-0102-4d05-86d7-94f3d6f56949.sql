-- Create table for local notification event tracking
CREATE TABLE public.local_notification_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'task_reminder', 'urgent_alarm', 'session_reminder', 'content_reminder'
  event TEXT NOT NULL, -- 'scheduled', 'delivered', 'tapped', 'cancelled'
  task_id UUID, -- optional reference to task
  notification_id INTEGER, -- the local notification ID (numeric hash)
  metadata JSONB DEFAULT '{}'::jsonb, -- extra context (title, offset, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for querying by user
CREATE INDEX idx_local_notification_events_user_id ON public.local_notification_events(user_id);

-- Index for querying by type and event
CREATE INDEX idx_local_notification_events_type_event ON public.local_notification_events(notification_type, event);

-- Index for recent events
CREATE INDEX idx_local_notification_events_created_at ON public.local_notification_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.local_notification_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert own notification events"
ON public.local_notification_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own events
CREATE POLICY "Users can view own notification events"
ON public.local_notification_events
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all notification events"
ON public.local_notification_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));