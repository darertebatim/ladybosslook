-- Create push notification logs table
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  destination_url TEXT,
  target_type TEXT NOT NULL DEFAULT 'all',
  target_course TEXT,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all push notification logs"
ON public.push_notification_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Service role can insert logs
CREATE POLICY "Service role can insert push notification logs"
ON public.push_notification_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX idx_push_logs_created_at ON public.push_notification_logs(created_at DESC);