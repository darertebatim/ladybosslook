
-- Table to track which users have coach chat unlocked (default: locked)
CREATE TABLE public.user_coach_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID
);

-- Enable RLS
ALTER TABLE public.user_coach_access ENABLE ROW LEVEL SECURITY;

-- Users can check their own access
CREATE POLICY "Users can view their own coach access"
ON public.user_coach_access
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage coach access
CREATE POLICY "Admins can manage coach access"
ON public.user_coach_access
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Staff with 'users' page permission can manage coach access
CREATE POLICY "Staff with users permission can manage coach access"
ON public.user_coach_access
FOR ALL
USING (
  public.can_access_admin_page(auth.uid(), 'users')
);
