-- Create table to track PWA installations
CREATE TABLE IF NOT EXISTS public.pwa_installations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  installed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  platform text,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pwa_installations ENABLE ROW LEVEL SECURITY;

-- Users can view their own installations
CREATE POLICY "Users can view their own installations"
ON public.pwa_installations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own installations
CREATE POLICY "Users can insert their own installations"
ON public.pwa_installations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all installations
CREATE POLICY "Admins can view all installations"
ON public.pwa_installations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_pwa_installations_user_id ON public.pwa_installations(user_id);
CREATE INDEX idx_pwa_installations_installed_at ON public.pwa_installations(installed_at DESC);