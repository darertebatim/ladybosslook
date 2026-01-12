-- Create table to track celebrated round completions per user
-- This replaces localStorage which doesn't persist reliably on native iOS apps

CREATE TABLE public.user_celebrated_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_id UUID NOT NULL REFERENCES public.program_rounds(id) ON DELETE CASCADE,
  celebrated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, round_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_celebrated_rounds ENABLE ROW LEVEL SECURITY;

-- Users can only see their own celebrated rounds
CREATE POLICY "Users can view their own celebrated rounds"
ON public.user_celebrated_rounds
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own celebrated rounds
CREATE POLICY "Users can mark their own rounds as celebrated"
ON public.user_celebrated_rounds
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_celebrated_rounds_user_id ON public.user_celebrated_rounds(user_id);
CREATE INDEX idx_user_celebrated_rounds_round_id ON public.user_celebrated_rounds(round_id);