-- Update the chat-attachments bucket to allow audio mime types
-- First, let's check if we need to update the allowed mime types

-- We'll update the bucket to accept more file types including audio
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp',
  'application/pdf', 
  'text/plain',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/m4a',
  'audio/x-m4a'
]
WHERE id = 'chat-attachments';