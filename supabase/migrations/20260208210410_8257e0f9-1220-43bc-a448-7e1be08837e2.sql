-- Add 'discussion' to the allowed post_type values so users can post in group channels
ALTER TABLE public.feed_posts DROP CONSTRAINT feed_posts_post_type_check;

ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_post_type_check 
CHECK (post_type = ANY (ARRAY['announcement'::text, 'update'::text, 'content_unlock'::text, 'session_reminder'::text, 'system'::text, 'voice_message'::text, 'discussion'::text]));