-- Create user notification preferences table
-- Stores per-user toggles for each notification type
CREATE TABLE public.user_notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action/Task Related
  morning_summary BOOLEAN NOT NULL DEFAULT true,
  evening_checkin BOOLEAN NOT NULL DEFAULT true,
  action_reminders BOOLEAN NOT NULL DEFAULT true,
  time_period_reminders BOOLEAN NOT NULL DEFAULT true,
  goal_nudges BOOLEAN NOT NULL DEFAULT true,
  goal_milestones BOOLEAN NOT NULL DEFAULT true,
  
  -- Momentum & Celebration
  momentum_celebration BOOLEAN NOT NULL DEFAULT true,
  daily_completion BOOLEAN NOT NULL DEFAULT true,
  
  -- Content & Programs
  content_drip BOOLEAN NOT NULL DEFAULT true,
  session_reminders BOOLEAN NOT NULL DEFAULT true,
  feed_posts BOOLEAN NOT NULL DEFAULT true,
  
  -- General
  announcements BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT user_notification_preferences_user_id_key UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON public.user_notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON public.user_notification_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);