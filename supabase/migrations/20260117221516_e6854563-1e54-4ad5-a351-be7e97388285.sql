-- Create the playlist-covers storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('playlist-covers', 'playlist-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for playlist covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'playlist-covers');

-- Allow authenticated users to upload playlist covers
CREATE POLICY "Authenticated users can upload playlist covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'playlist-covers' AND auth.role() = 'authenticated');

-- Allow authenticated users to update playlist covers
CREATE POLICY "Authenticated users can update playlist covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'playlist-covers' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete playlist covers
CREATE POLICY "Authenticated users can delete playlist covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'playlist-covers' AND auth.role() = 'authenticated');