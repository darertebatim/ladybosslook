-- Create storage bucket for routine images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'routine-images',
  'routine-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload images to routine-images bucket
CREATE POLICY "Admins can upload routine images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'routine-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public read access to routine images
CREATE POLICY "Public can view routine images"
ON storage.objects FOR SELECT
USING (bucket_id = 'routine-images');

-- Allow admins to delete routine images
CREATE POLICY "Admins can delete routine images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'routine-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);