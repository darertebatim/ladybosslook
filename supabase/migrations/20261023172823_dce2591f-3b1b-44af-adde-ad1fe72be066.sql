CREATE POLICY "Users can view attachments sent in their conversations"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    JOIN public.chat_messages m ON m.conversation_id = c.id
    WHERE c.user_id = auth.uid()
      AND m.attachment_url LIKE '%/chat-attachments/' || storage.objects.name
  )
);