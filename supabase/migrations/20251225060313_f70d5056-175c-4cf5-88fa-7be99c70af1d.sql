-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create program_sessions table for managing individual course sessions
CREATE TABLE public.program_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid REFERENCES public.program_rounds(id) ON DELETE CASCADE NOT NULL,
  session_number integer NOT NULL,
  title text NOT NULL,
  description text,
  session_date timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 90,
  meeting_link text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all sessions
CREATE POLICY "Admins can manage sessions" ON public.program_sessions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enrolled users can view their sessions
CREATE POLICY "Enrolled users can view sessions" ON public.program_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.round_id = program_sessions.round_id
    AND ce.user_id = auth.uid()
    AND ce.status = 'active'
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_program_sessions_round_id ON public.program_sessions(round_id);
CREATE INDEX idx_program_sessions_session_date ON public.program_sessions(session_date);

-- Add trigger for updated_at
CREATE TRIGGER update_program_sessions_updated_at
BEFORE UPDATE ON public.program_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();