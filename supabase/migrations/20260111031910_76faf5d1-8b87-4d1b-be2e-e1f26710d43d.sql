-- Add voice message support to feed_posts
ALTER TABLE public.feed_posts 
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS audio_duration integer;

-- Add voice_message to post_type options (handled at app level, no enum)

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed-voice-messages', 'feed-voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for feed-voice-messages bucket
-- Allow authenticated users to read all voice messages
CREATE POLICY "Public can view feed voice messages"
ON storage.objects FOR SELECT
USING (bucket_id = 'feed-voice-messages');

-- Allow admins to upload voice messages
CREATE POLICY "Admins can upload feed voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feed-voice-messages' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to update voice messages
CREATE POLICY "Admins can update feed voice messages"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'feed-voice-messages' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow admins to delete voice messages
CREATE POLICY "Admins can delete feed voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feed-voice-messages' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);