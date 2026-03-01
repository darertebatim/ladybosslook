
-- Add show_in_app_waitlist flag to program_catalog
ALTER TABLE public.program_catalog 
ADD COLUMN show_in_app_waitlist boolean NOT NULL DEFAULT false;

-- Create program_waitlist table
CREATE TABLE public.program_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_slug)
);

-- Enable RLS
ALTER TABLE public.program_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist" ON public.program_waitlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can join waitlist
CREATE POLICY "Users can join waitlist" ON public.program_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave waitlist
CREATE POLICY "Users can leave waitlist" ON public.program_waitlist
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist" ON public.program_waitlist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for quick lookups
CREATE INDEX idx_program_waitlist_slug ON public.program_waitlist(program_slug);
CREATE INDEX idx_program_waitlist_user ON public.program_waitlist(user_id);
