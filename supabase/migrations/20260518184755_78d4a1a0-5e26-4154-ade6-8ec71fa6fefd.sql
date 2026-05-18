DROP POLICY IF EXISTS "Users can view posts in accessible channels" ON public.feed_posts;
DROP POLICY IF EXISTS "Admins can manage posts" ON public.feed_posts;

CREATE POLICY "Users can view posts in accessible channels"
ON public.feed_posts
FOR SELECT
USING (
  public.has_channel_access(auth.uid(), channel_id)
  AND (scheduled_for IS NULL OR scheduled_for <= now())
);

CREATE POLICY "Admins can create posts"
ON public.feed_posts
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update posts"
ON public.feed_posts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete posts"
ON public.feed_posts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.get_scheduled_feed_posts()
RETURNS TABLE (
  id uuid,
  channel_id uuid,
  title text,
  content text,
  image_url text,
  scheduled_for timestamptz,
  send_push boolean,
  is_pinned boolean,
  display_name text,
  channel_name text,
  author_full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.channel_id,
    p.title,
    p.content,
    p.image_url,
    p.scheduled_for,
    p.send_push,
    p.is_pinned,
    p.display_name,
    c.name AS channel_name,
    pr.full_name AS author_full_name
  FROM public.feed_posts p
  LEFT JOIN public.feed_channels c ON c.id = p.channel_id
  LEFT JOIN public.profiles pr ON pr.id = p.author_id
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
    AND p.scheduled_for IS NOT NULL
    AND p.scheduled_for > now()
  ORDER BY p.scheduled_for ASC;
$$;

REVOKE ALL ON FUNCTION public.get_scheduled_feed_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheduled_feed_posts() TO authenticated;