INSERT INTO public.chat_messages (conversation_id, sender_id, sender_type, content, is_broadcast, broadcast_id, created_at, attachment_url, attachment_name, attachment_type, attachment_size, is_read)
SELECT conversation_id, sender_id, sender_type, '', false, broadcast_id, created_at + interval '1 second', attachment_url, attachment_name, attachment_type, attachment_size, is_read
FROM public.chat_messages
WHERE is_broadcast = true AND attachment_url LIKE '%/audio_files/broadcast-voice/f058fa5b-0762-4f79-98d1-c1683c824f2b.mp3';

UPDATE public.chat_messages
SET attachment_url = NULL, attachment_name = NULL, attachment_type = NULL, attachment_size = NULL
WHERE is_broadcast = true AND attachment_url LIKE '%/audio_files/broadcast-voice/f058fa5b-0762-4f79-98d1-c1683c824f2b.mp3';