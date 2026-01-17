-- Add cover_image_url column to program_catalog for program cover images
ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.program_catalog.cover_image_url IS 'URL to the program cover image stored in Supabase storage';

-- Create storage bucket for program covers if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-covers', 'program-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for program covers bucket
CREATE POLICY "Public can view program covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-covers');

CREATE POLICY "Admins can upload program covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'program-covers' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update program covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'program-covers' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete program covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'program-covers' 
  AND public.has_role(auth.uid(), 'admin')
);