-- Drop the existing check constraint and recreate with voice_message included
ALTER TABLE public.feed_posts 
DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;

ALTER TABLE public.feed_posts 
ADD CONSTRAINT feed_posts_post_type_check 
CHECK (post_type IN ('announcement', 'update', 'content_unlock', 'session_reminder', 'system', 'voice_message'));