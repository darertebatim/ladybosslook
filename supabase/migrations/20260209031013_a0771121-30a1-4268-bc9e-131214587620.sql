-- Push notification configuration table (admin-controlled)
-- App fetches this config and schedules LOCAL notifications accordingly
CREATE TABLE public.pn_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Notification identifier (unique key)
  notification_key text NOT NULL UNIQUE,
  -- Display info
  title text NOT NULL,
  body text NOT NULL,
  emoji text DEFAULT '🔔',
  -- Schedule configuration
  schedule_hour integer NOT NULL CHECK (schedule_hour >= 0 AND schedule_hour <= 23),
  schedule_minute integer NOT NULL DEFAULT 0 CHECK (schedule_minute >= 0 AND schedule_minute <= 59),
  -- Which days to send (0=Sun, 1=Mon, ..., 6=Sat). Empty = every day
  repeat_days integer[] DEFAULT '{}',
  -- Control flags
  is_enabled boolean NOT NULL DEFAULT true,
  -- Sound settings
  sound text DEFAULT 'default',
  is_urgent boolean DEFAULT false,
  -- Category for grouping in UI
  category text NOT NULL DEFAULT 'daily',
  -- Sort order for admin UI
  sort_order integer DEFAULT 0,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pn_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage all config
CREATE POLICY "Admins can manage pn_config"
ON public.pn_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can read (for app sync)
CREATE POLICY "Users can read pn_config"
ON public.pn_config
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger to update updated_at
CREATE TRIGGER update_pn_config_updated_at
BEFORE UPDATE ON public.pn_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pn_config;

-- Insert default configurations (all daily notifications)
INSERT INTO public.pn_config (notification_key, title, body, emoji, schedule_hour, schedule_minute, category, sort_order) VALUES
-- Morning Summary
('morning_summary', 'Good morning!', 'Your actions for today are ready. Let''s make it count.', '☀️', 7, 0, 'daily', 1),
-- Evening Check-in
('evening_checkin', 'Evening check-in', 'A few actions are still waiting for you today.', '🌅', 18, 0, 'daily', 2),
-- Time Period Reminders
('period_morning', 'Morning time', 'Your morning actions are waiting gently.', '🌅', 6, 0, 'time_period', 10),
('period_afternoon', 'Afternoon is here', 'Time for your afternoon actions.', '🌤️', 12, 0, 'time_period', 11),
('period_evening', 'Evening ritual', 'Your evening actions await.', '🌇', 17, 0, 'time_period', 12),
('period_bedtime', 'Bedtime routine', 'Time to wind down with your bedtime actions.', '🌙', 21, 0, 'time_period', 13),
-- Goal Nudges
('goal_nudge_9am', 'Goal Check', 'How''s your water intake going? 💧', '💧', 9, 0, 'goal_nudge', 20),
('goal_nudge_12pm', 'Goal Check', 'Midday check: Keep going on your goals!', '💧', 12, 0, 'goal_nudge', 21),
('goal_nudge_3pm', 'Goal Check', 'Afternoon hydration reminder', '💧', 15, 0, 'goal_nudge', 22),
('goal_nudge_6pm', 'Goal Check', 'Almost there! Final push on your goals', '💧', 18, 0, 'goal_nudge', 23),
-- Weekly Summary (Monday 9am)
('weekly_summary', 'Weekly Progress', 'Here''s your weekly progress summary!', '📊', 9, 0, 'weekly', 30),
-- Momentum Celebration
('momentum_celebration', 'Momentum Milestone', 'You''re on fire! Keep the streak going!', '🔥', 10, 0, 'momentum', 40);