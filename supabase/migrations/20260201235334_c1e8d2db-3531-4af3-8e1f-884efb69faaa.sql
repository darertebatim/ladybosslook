-- Create table to track which routines_bank items users have added
CREATE TABLE public.user_routines_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines_bank(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT user_routines_bank_unique UNIQUE (user_id, routine_id)
);

-- Enable RLS
ALTER TABLE public.user_routines_bank ENABLE ROW LEVEL SECURITY;

-- Users can view their own added routines
CREATE POLICY "Users can view their own added routines"
ON public.user_routines_bank
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add routines
CREATE POLICY "Users can insert their own added routines"
ON public.user_routines_bank
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own added routines (e.g., toggle is_active)
CREATE POLICY "Users can update their own added routines"
ON public.user_routines_bank
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete their own added routines"
ON public.user_routines_bank
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_routines_bank_user_id ON public.user_routines_bank(user_id);
CREATE INDEX idx_user_routines_bank_routine_id ON public.user_routines_bank(routine_id);