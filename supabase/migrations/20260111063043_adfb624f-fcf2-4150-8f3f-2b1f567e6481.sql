-- Add sharing columns to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN shared_with_admin BOOLEAN DEFAULT false,
ADD COLUMN shared_at TIMESTAMPTZ;

-- Create journal reminder settings table
CREATE TABLE public.journal_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  reminder_time TIME NOT NULL DEFAULT '20:00:00',
  timezone TEXT DEFAULT 'America/Los_Angeles',
  last_reminded_at DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_reminder_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_reminder_settings
CREATE POLICY "Users can view their own reminder settings"
ON public.journal_reminder_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminder settings"
ON public.journal_reminder_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings"
ON public.journal_reminder_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_journal_reminder_settings_updated_at
BEFORE UPDATE ON public.journal_reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();