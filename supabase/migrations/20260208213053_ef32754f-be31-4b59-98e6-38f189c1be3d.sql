-- Add reply_to_post_id column for reply functionality
ALTER TABLE public.feed_posts 
ADD COLUMN reply_to_post_id uuid REFERENCES public.feed_posts(id) ON DELETE SET NULL;

-- Add index for faster reply lookups
CREATE INDEX idx_feed_posts_reply_to ON public.feed_posts(reply_to_post_id) WHERE reply_to_post_id IS NOT NULL;