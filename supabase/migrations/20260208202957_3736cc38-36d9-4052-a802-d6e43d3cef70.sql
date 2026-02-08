-- Add RLS policy to allow users to INSERT posts in channels where allow_comments = true
-- Users can post in group chat channels (discussion posts)

CREATE POLICY "Users can post in group channels"
ON public.feed_posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND author_id = auth.uid()
  AND post_type = 'discussion'
  AND is_system = false
  AND EXISTS (
    SELECT 1 FROM feed_channels 
    WHERE id = channel_id 
    AND allow_comments = true
  )
);