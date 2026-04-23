-- Create dedicated bucket for instructor profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instructor-photos',
  'instructor-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Public can view instructor photos
DROP POLICY IF EXISTS "Public can view instructor photos" ON storage.objects;
CREATE POLICY "Public can view instructor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-photos');

-- Admins can upload instructor photos
DROP POLICY IF EXISTS "Admins can upload instructor photos" ON storage.objects;
CREATE POLICY "Admins can upload instructor photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'instructor-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update instructor photos
DROP POLICY IF EXISTS "Admins can update instructor photos" ON storage.objects;
CREATE POLICY "Admins can update instructor photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'instructor-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete instructor photos
DROP POLICY IF EXISTS "Admins can delete instructor photos" ON storage.objects;
CREATE POLICY "Admins can delete instructor photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'instructor-photos'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);