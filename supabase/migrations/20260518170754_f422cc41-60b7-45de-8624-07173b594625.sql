-- Add scheduled_for column
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_scheduled_for
  ON public.feed_posts (scheduled_for)
  WHERE scheduled_for IS NOT NULL;

-- Replace SELECT policy so non-admins cannot see future-scheduled posts
DROP POLICY IF EXISTS "Users can view posts in accessible channels" ON public.feed_posts;

CREATE POLICY "Users can view posts in accessible channels"
ON public.feed_posts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_channel_access(auth.uid(), channel_id)
    AND (scheduled_for IS NULL OR scheduled_for <= now())
  )
);

-- Publisher: when a scheduled post's time arrives, "release" it by bumping
-- created_at/updated_at to now() (so the existing 15-min push notification
-- window picks it up naturally) and clearing scheduled_for.
CREATE OR REPLACE FUNCTION public.publish_due_scheduled_posts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  WITH updated AS (
    UPDATE public.feed_posts
       SET scheduled_for = NULL,
           created_at = now(),
           updated_at = now()
     WHERE scheduled_for IS NOT NULL
       AND scheduled_for <= now()
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN jsonb_build_object('published', v_count, 'at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.publish_due_scheduled_posts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_due_scheduled_posts() TO service_role, authenticated;