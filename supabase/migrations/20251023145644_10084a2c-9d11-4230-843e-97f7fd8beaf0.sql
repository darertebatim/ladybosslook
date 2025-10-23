-- Create program_rounds table for managing course cohorts
CREATE TABLE IF NOT EXISTS public.program_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_slug TEXT NOT NULL,
  round_name TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  max_students INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_slug, round_number)
);

-- Enable RLS on program_rounds
ALTER TABLE public.program_rounds ENABLE ROW LEVEL SECURITY;

-- RLS policies for program_rounds
CREATE POLICY "Anyone can view active and upcoming rounds"
  ON public.program_rounds
  FOR SELECT
  USING (status IN ('upcoming', 'active') OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert rounds"
  ON public.program_rounds
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rounds"
  ON public.program_rounds
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rounds"
  ON public.program_rounds
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add round_id to course_enrollments
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES public.program_rounds(id);

-- Add round_id to announcements
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS target_round_id UUID REFERENCES public.program_rounds(id);

-- Add round_id to push_notification_logs
ALTER TABLE public.push_notification_logs
ADD COLUMN IF NOT EXISTS target_round_id UUID REFERENCES public.program_rounds(id);

-- Add subscription_duration to program_catalog
ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS subscription_duration TEXT;

-- Create trigger for updating program_rounds updated_at
CREATE TRIGGER update_program_rounds_updated_at
  BEFORE UPDATE ON public.program_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_program_catalog_updated_at();

-- Create index for faster round lookups
CREATE INDEX IF NOT EXISTS idx_program_rounds_slug_status ON public.program_rounds(program_slug, status);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_round ON public.course_enrollments(round_id);
CREATE INDEX IF NOT EXISTS idx_announcements_round ON public.announcements(target_round_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_round ON public.push_notification_logs(target_round_id);