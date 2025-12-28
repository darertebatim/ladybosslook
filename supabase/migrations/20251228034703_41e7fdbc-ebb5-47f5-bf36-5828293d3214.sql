-- Create table for storing user admin page permissions
CREATE TABLE public.user_admin_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    page_slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, page_slug)
);

-- Enable RLS
ALTER TABLE public.user_admin_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
  ON public.user_admin_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions (needed for the hook to fetch permissions)
CREATE POLICY "Users can view their own permissions"
  ON public.user_admin_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Create helper function to check if user can access an admin page
CREATE OR REPLACE FUNCTION public.can_access_admin_page(_user_id uuid, _page_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_admin_permissions
      WHERE user_id = _user_id AND page_slug = _page_slug
    )
$$;