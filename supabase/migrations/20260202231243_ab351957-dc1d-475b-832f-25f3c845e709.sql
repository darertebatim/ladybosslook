-- Create emotion_logs table
CREATE TABLE public.emotion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  valence text NOT NULL, -- 'pleasant', 'neutral', 'unpleasant'
  category text NOT NULL, -- e.g., 'sad', 'angry', 'optimistic'
  emotion text NOT NULL, -- specific emotion e.g., 'lonely', 'frustrated'
  contexts text[] DEFAULT '{}', -- array of context selections
  notes text, -- optional reflection text
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own emotion logs" ON public.emotion_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion logs" ON public.emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotion logs" ON public.emotion_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all emotion logs (for analytics)
CREATE POLICY "Admins can view all emotion logs" ON public.emotion_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));