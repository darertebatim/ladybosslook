
CREATE TABLE public.aperture_memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  source text NOT NULL DEFAULT 'freeform',
  bucket_slug text,
  question_key text,
  source_ref uuid,
  confidence numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX aperture_memory_items_user_idx ON public.aperture_memory_items(user_id);
CREATE INDEX aperture_memory_items_user_bucket_idx ON public.aperture_memory_items(user_id, bucket_slug);
CREATE UNIQUE INDEX aperture_memory_items_user_q_unique
  ON public.aperture_memory_items(user_id, bucket_slug, question_key)
  WHERE question_key IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_memory_items TO authenticated;
GRANT ALL ON public.aperture_memory_items TO service_role;

ALTER TABLE public.aperture_memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own memory items"
  ON public.aperture_memory_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER aperture_memory_items_updated_at
  BEFORE UPDATE ON public.aperture_memory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.aperture_memory_items
  (user_id, content, source, bucket_slug, question_key, created_at, updated_at)
SELECT user_id,
  CASE
    WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}'
    WHEN value ? 'text' THEN value->>'text'
    ELSE value::text
  END,
  'bucket_answer', bucket_slug, question_key, created_at, updated_at
FROM public.aperture_memory_answers
WHERE value IS NOT NULL;

INSERT INTO public.aperture_memory_items
  (user_id, content, source, bucket_slug, source_ref, confidence, is_active, created_at, updated_at)
SELECT user_id, fact, 'ai_extracted', bucket_slug, source_ref, confidence, COALESCE(is_active, true), created_at, created_at
FROM public.aperture_ai_facts;

DROP TABLE IF EXISTS public.aperture_memory_answers CASCADE;
DROP TABLE IF EXISTS public.aperture_ai_facts CASCADE;

ALTER TABLE public.aperture_buckets
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS aperture_buckets_user_idx ON public.aperture_buckets(user_id);

DROP POLICY IF EXISTS "Users insert their own buckets" ON public.aperture_buckets;
CREATE POLICY "Users insert their own buckets" ON public.aperture_buckets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Users update their own buckets" ON public.aperture_buckets;
CREATE POLICY "Users update their own buckets" ON public.aperture_buckets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete their own buckets" ON public.aperture_buckets;
CREATE POLICY "Users delete their own buckets" ON public.aperture_buckets
  FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.aperture_bucket_questions
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS aperture_bucket_questions_user_idx ON public.aperture_bucket_questions(user_id);

DROP POLICY IF EXISTS "Users insert their own bucket questions" ON public.aperture_bucket_questions;
CREATE POLICY "Users insert their own bucket questions" ON public.aperture_bucket_questions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());

DELETE FROM public.aperture_bucket_questions
  WHERE bucket_slug IN ('basics','customers','revenue','marketing','goals','challenges');
DELETE FROM public.aperture_buckets
  WHERE slug IN ('basics','customers','revenue','marketing','goals','challenges');

ALTER TABLE public.aperture_actions ALTER COLUMN needs DROP NOT NULL;
UPDATE public.aperture_actions SET needs = NULL;

CREATE OR REPLACE FUNCTION public.aperture_mark_card_stale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  IF v_user_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  INSERT INTO public.aperture_memory_card (user_id, stale)
  VALUES (v_user_id, true)
  ON CONFLICT (user_id) DO UPDATE SET stale = true;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER aperture_mark_card_stale_on_items
  AFTER INSERT OR UPDATE OR DELETE ON public.aperture_memory_items
  FOR EACH ROW EXECUTE FUNCTION public.aperture_mark_card_stale();
