
-- Create fasting_sessions table
CREATE TABLE public.fasting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  protocol TEXT NOT NULL DEFAULT '16:8',
  fasting_hours INTEGER NOT NULL DEFAULT 16,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fasting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fasting sessions"
  ON public.fasting_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fasting sessions"
  ON public.fasting_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fasting sessions"
  ON public.fasting_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fasting sessions"
  ON public.fasting_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create fasting_preferences table
CREATE TABLE public.fasting_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  default_protocol TEXT NOT NULL DEFAULT '16:8',
  default_fasting_hours INTEGER NOT NULL DEFAULT 16,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fasting_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fasting preferences"
  ON public.fasting_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own fasting preferences"
  ON public.fasting_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fasting preferences"
  ON public.fasting_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_fasting_preferences_updated_at
  BEFORE UPDATE ON public.fasting_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
