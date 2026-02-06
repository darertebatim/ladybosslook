-- Add user_id column to pn_schedule_logs for user-specific notification tracking
-- This allows tracking which user received which notification type
ALTER TABLE public.pn_schedule_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS notification_type TEXT,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_pn_schedule_logs_user_type ON public.pn_schedule_logs(user_id, notification_type);
CREATE INDEX IF NOT EXISTS idx_pn_schedule_logs_sent_at ON public.pn_schedule_logs(sent_at);