-- Create promo_banners table
CREATE TABLE public.promo_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cover_image_url TEXT NOT NULL,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('routine', 'playlist', 'journal', 'programs', 'custom_url')),
  destination_id UUID,
  custom_url TEXT,
  display_frequency TEXT NOT NULL DEFAULT 'once' CHECK (display_frequency IN ('once', 'daily', 'weekly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admins can manage promo banners"
ON public.promo_banners
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can view active banners
CREATE POLICY "Users can view active promo banners"
ON public.promo_banners
FOR SELECT
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Create trigger for updated_at
CREATE TRIGGER update_promo_banners_updated_at
BEFORE UPDATE ON public.promo_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for promo banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('promo-banners', 'promo-banners', true);

-- Storage policies
CREATE POLICY "Anyone can view promo banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'promo-banners');

CREATE POLICY "Admins can upload promo banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo banner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));