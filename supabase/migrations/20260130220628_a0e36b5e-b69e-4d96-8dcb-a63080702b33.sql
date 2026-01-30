-- Create period_logs table for daily tracking
CREATE TABLE public.period_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  is_period_day BOOLEAN NOT NULL DEFAULT true,
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'medium', 'heavy')),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT period_logs_user_date_unique UNIQUE (user_id, date)
);

-- Create period_settings table for user preferences
CREATE TABLE public.period_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  average_cycle INTEGER NOT NULL DEFAULT 28,
  average_period INTEGER NOT NULL DEFAULT 5,
  last_period_start DATE,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_days INTEGER NOT NULL DEFAULT 2,
  show_on_home BOOLEAN NOT NULL DEFAULT true,
  onboarding_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.period_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.period_settings ENABLE ROW LEVEL SECURITY;

-- STRICT PRIVACY: Only users can access their own period data (NO admin access)
-- period_logs policies
CREATE POLICY "Users can view own period logs"
  ON public.period_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period logs"
  ON public.period_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period logs"
  ON public.period_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own period logs"
  ON public.period_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- period_settings policies
CREATE POLICY "Users can view own period settings"
  ON public.period_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period settings"
  ON public.period_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period settings"
  ON public.period_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own period settings"
  ON public.period_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on period_logs
CREATE TRIGGER update_period_logs_updated_at
  BEFORE UPDATE ON public.period_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on period_settings
CREATE TRIGGER update_period_settings_updated_at
  BEFORE UPDATE ON public.period_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();