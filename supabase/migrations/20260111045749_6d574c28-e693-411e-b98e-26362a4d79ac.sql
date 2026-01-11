-- Add display_name column to feed_posts for custom sender names
ALTER TABLE public.feed_posts ADD COLUMN display_name text;