-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Add attachment columns to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN attachment_url text,
ADD COLUMN attachment_name text,
ADD COLUMN attachment_type text,
ADD COLUMN attachment_size integer;

-- Storage policies for chat attachments
-- Users can upload to their own conversation folder
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view attachments in their conversations
CREATE POLICY "Users can view their chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all chat attachments
CREATE POLICY "Admins can view all chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can upload attachments
CREATE POLICY "Admins can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND has_role(auth.uid(), 'admin'::app_role)
);