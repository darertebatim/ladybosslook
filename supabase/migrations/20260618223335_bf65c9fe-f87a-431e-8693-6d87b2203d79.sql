
CREATE TABLE public.aperture_source_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('website','instagram')),
  url TEXT NOT NULL,
  raw_text TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_source_snapshots TO authenticated;
GRANT ALL ON public.aperture_source_snapshots TO service_role;

ALTER TABLE public.aperture_source_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own source snapshots"
  ON public.aperture_source_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_aperture_source_snapshots_updated_at
  BEFORE UPDATE ON public.aperture_source_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_aperture_source_snapshots_user ON public.aperture_source_snapshots(user_id);
