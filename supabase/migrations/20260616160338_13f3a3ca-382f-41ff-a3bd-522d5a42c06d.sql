
-- 1. Create unified generated items table
CREATE TABLE public.aperture_generated_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  status_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_bucket_slugs TEXT[] NOT NULL DEFAULT '{}',
  source_memory_ids UUID[] NOT NULL DEFAULT '{}',
  dedupe_key TEXT,
  generator TEXT,
  generator_version TEXT,
  score NUMERIC,
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique dedupe per user+kind+dedupe_key (when set)
CREATE UNIQUE INDEX aperture_generated_items_dedupe_unique
  ON public.aperture_generated_items (user_id, kind, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- Hot-path indexes
CREATE INDEX aperture_generated_items_user_kind_status_idx
  ON public.aperture_generated_items (user_id, kind, status, created_at DESC);
CREATE INDEX aperture_generated_items_user_created_idx
  ON public.aperture_generated_items (user_id, created_at DESC);
CREATE INDEX aperture_generated_items_expires_idx
  ON public.aperture_generated_items (expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX aperture_generated_items_scheduled_idx
  ON public.aperture_generated_items (scheduled_for)
  WHERE scheduled_for IS NOT NULL;
CREATE INDEX aperture_generated_items_payload_gin
  ON public.aperture_generated_items USING GIN (payload);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_generated_items TO authenticated;
GRANT ALL ON public.aperture_generated_items TO service_role;

-- 3. RLS
ALTER TABLE public.aperture_generated_items ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Users manage their own generated items"
  ON public.aperture_generated_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all generated items"
  ON public.aperture_generated_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger
CREATE TRIGGER update_aperture_generated_items_updated_at
  BEFORE UPDATE ON public.aperture_generated_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Drop the empty legacy table
DROP TABLE IF EXISTS public.aperture_suggestions;
