-- Create table to track user content views
CREATE TABLE public.user_content_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('enrollment', 'round')),
  content_id UUID NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  content_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.user_content_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own content views
CREATE POLICY "Users can view their own content views"
ON public.user_content_views
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own content views
CREATE POLICY "Users can insert their own content views"
ON public.user_content_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own content views
CREATE POLICY "Users can update their own content views"
ON public.user_content_views
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own content views
CREATE POLICY "Users can delete their own content views"
ON public.user_content_views
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all content views
CREATE POLICY "Admins can view all content views"
ON public.user_content_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_user_content_views_user_id ON public.user_content_views(user_id);
CREATE INDEX idx_user_content_views_content ON public.user_content_views(user_id, content_type, content_id);