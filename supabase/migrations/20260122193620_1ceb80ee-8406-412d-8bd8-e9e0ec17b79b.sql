-- Create push_notification_schedules table for PN Control Center
CREATE TABLE public.push_notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  function_name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_notification_schedules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage PN schedules
CREATE POLICY "Admins can view PN schedules"
ON public.push_notification_schedules
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage PN schedules"
ON public.push_notification_schedules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_pn_schedules_updated_at
BEFORE UPDATE ON public.push_notification_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 6 default PN schedules
INSERT INTO public.push_notification_schedules (name, function_name, schedule, is_active, description) VALUES
('Drip Content', 'send-drip-notifications', '0 6 * * *', true, 'Notifies users when new audio lessons unlock based on their course progress'),
('Session Reminders', 'send-session-reminders', '0 * * * *', true, 'Sends reminders 24h and 1h before scheduled live sessions'),
('Task Reminders', 'send-task-reminders', '*/5 * * * *', true, 'Triggers notifications based on user-set task reminder times'),
('Journal Reminders', 'send-journal-reminders', '*/15 * * * *', true, 'Reminds users to journal at their preferred time'),
('Feed Posts', 'send-feed-post-notifications', 'trigger', true, 'Notifies users when new posts are added to their program feed'),
('Weekly Summary', 'send-weekly-summary', '0 9 * * 1', true, 'Sends weekly engagement stats every Monday at 9 AM');

-- Create pn_schedule_logs table for tracking scheduled notification runs
CREATE TABLE public.pn_schedule_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.push_notification_schedules(id) ON DELETE SET NULL,
  function_name TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pn_schedule_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view schedule logs"
ON public.pn_schedule_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));