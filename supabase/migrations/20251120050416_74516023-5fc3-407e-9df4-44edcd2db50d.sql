-- Create table to track app installations (first app opens)
CREATE TABLE IF NOT EXISTS public.app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios',
  app_version TEXT,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(device_id)
);

-- Enable RLS
ALTER TABLE public.app_installations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for tracking first opens)
CREATE POLICY "Anyone can track app installations"
ON public.app_installations
FOR INSERT
WITH CHECK (true);

-- Only admins can view installation data
CREATE POLICY "Admins can view all installations"
ON public.app_installations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_app_installations_installed_at ON public.app_installations(installed_at DESC);
CREATE INDEX idx_app_installations_platform ON public.app_installations(platform);