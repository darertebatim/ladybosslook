-- Create bucket for feed attachments (images, files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-attachments', 'feed-attachments', true);

-- RLS: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to feed-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feed-attachments');

-- RLS: Allow public read access  
CREATE POLICY "Allow public read from feed-attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feed-attachments');

-- RLS: Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated delete from feed-attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'feed-attachments');