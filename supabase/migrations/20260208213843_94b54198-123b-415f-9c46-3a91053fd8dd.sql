-- Allow users to delete their own discussion posts
CREATE POLICY "Users can delete own discussion posts" 
ON public.feed_posts 
FOR DELETE 
USING (
  auth.uid() = author_id 
  AND post_type = 'discussion'
);