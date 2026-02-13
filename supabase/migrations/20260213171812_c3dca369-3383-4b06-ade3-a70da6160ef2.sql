
-- Create weight_logs table for fasting stats
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight_value NUMERIC(5,1) NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'lb',
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weight logs"
  ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weight logs"
  ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weight logs"
  ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own weight logs"
  ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);

-- Add weight_goal to fasting_preferences
ALTER TABLE public.fasting_preferences
  ADD COLUMN weight_goal NUMERIC(5,1) DEFAULT NULL,
  ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'lb';
