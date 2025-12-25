-- Create home_banners table for admin-managed banners on AppHome
CREATE TABLE public.home_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  button_text TEXT,
  button_url TEXT,
  youtube_url TEXT,
  background_color TEXT DEFAULT 'primary',
  icon TEXT DEFAULT 'megaphone',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;

-- Admins can manage all banners
CREATE POLICY "Admins can manage home banners"
ON public.home_banners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view active banners (within schedule)
CREATE POLICY "Users can view active banners"
ON public.home_banners
FOR SELECT
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= NOW()) 
  AND (ends_at IS NULL OR ends_at >= NOW())
);

-- Create trigger for updated_at
CREATE TRIGGER update_home_banners_updated_at
BEFORE UPDATE ON public.home_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();