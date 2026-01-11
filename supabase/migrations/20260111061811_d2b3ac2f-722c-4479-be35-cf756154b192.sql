-- Create journal_entries table for daily personal reflections
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own entries
CREATE POLICY "Users can view own journal entries" 
  ON public.journal_entries FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own entries
CREATE POLICY "Users can create journal entries" 
  ON public.journal_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own entries
CREATE POLICY "Users can update own journal entries" 
  ON public.journal_entries FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own entries
CREATE POLICY "Users can delete own journal entries" 
  ON public.journal_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON public.journal_entries(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();