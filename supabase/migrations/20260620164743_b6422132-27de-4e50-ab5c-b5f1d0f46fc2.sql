CREATE TABLE public.aperture_bucket_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket_slug text NOT NULL,
  summary text NOT NULL DEFAULT '',
  facts_count integer NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, bucket_slug)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_bucket_briefs TO authenticated;
GRANT ALL ON public.aperture_bucket_briefs TO service_role;

ALTER TABLE public.aperture_bucket_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read their bucket briefs"
  ON public.aperture_bucket_briefs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "owners write their bucket briefs"
  ON public.aperture_bucket_briefs FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER aperture_bucket_briefs_updated_at
  BEFORE UPDATE ON public.aperture_bucket_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX aperture_bucket_briefs_user_bucket_idx
  ON public.aperture_bucket_briefs (user_id, bucket_slug);