-- Table to exclude specific users from specific channels
CREATE TABLE public.feed_channel_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.feed_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.feed_channel_exclusions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage exclusions
CREATE POLICY "Admins can manage exclusions"
  ON public.feed_channel_exclusions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can read their own exclusions (to know they're excluded)
CREATE POLICY "Users can read own exclusions"
  ON public.feed_channel_exclusions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());