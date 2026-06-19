
ALTER TABLE public.aperture_chats
  ADD COLUMN IF NOT EXISTS entry_point text NOT NULL DEFAULT 'general_chat',
  ADD COLUMN IF NOT EXISTS bucket_slug text NULL;

CREATE TABLE IF NOT EXISTS public.aperture_user_bucket_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket_slug text NOT NULL,
  signal_type text NOT NULL,
  weight real NOT NULL DEFAULT 1,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.aperture_user_bucket_signals TO authenticated;
GRANT ALL ON public.aperture_user_bucket_signals TO service_role;

ALTER TABLE public.aperture_user_bucket_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own signals read"
  ON public.aperture_user_bucket_signals FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "own signals insert"
  ON public.aperture_user_bucket_signals FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_aperture_signals_user_bucket
  ON public.aperture_user_bucket_signals (user_id, bucket_slug, created_at DESC);
