-- Create app update check logs table
CREATE TABLE public.app_update_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  device_version TEXT NOT NULL,
  latest_version TEXT NOT NULL,
  update_available BOOLEAN NOT NULL DEFAULT false,
  platform TEXT NOT NULL DEFAULT 'ios',
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_update_logs ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can view update logs"
  ON public.app_update_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert policy for authenticated users (their own logs)
CREATE POLICY "Users can insert their own update logs"
  ON public.app_update_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_app_update_logs_checked_at ON public.app_update_logs(checked_at DESC);
CREATE INDEX idx_app_update_logs_user_id ON public.app_update_logs(user_id);