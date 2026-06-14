
-- Enable pgvector for future RAG (Phase 2)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================================
-- CATALOG TABLES (global, read-only to users; admins manage)
-- =====================================================================

CREATE TABLE public.aperture_buckets (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  blurb TEXT,
  glyph TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aperture_buckets TO anon, authenticated;
GRANT ALL ON public.aperture_buckets TO service_role;
ALTER TABLE public.aperture_buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aperture buckets readable by all"
  ON public.aperture_buckets FOR SELECT USING (true);
CREATE POLICY "Admins manage aperture buckets"
  ON public.aperture_buckets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.aperture_bucket_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_slug TEXT NOT NULL REFERENCES public.aperture_buckets(slug) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  prompt TEXT NOT NULL,
  hint TEXT,
  input_kind TEXT NOT NULL DEFAULT 'text',  -- text | longtext | choice | number
  choices JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket_slug, question_key)
);
GRANT SELECT ON public.aperture_bucket_questions TO anon, authenticated;
GRANT ALL ON public.aperture_bucket_questions TO service_role;
ALTER TABLE public.aperture_bucket_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aperture bucket questions readable by all"
  ON public.aperture_bucket_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage aperture bucket questions"
  ON public.aperture_bucket_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.aperture_actions (
  slug TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                     -- 'playbook' | 'prompt'
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  blurb TEXT,
  why TEXT,
  duration TEXT,
  needs TEXT[] NOT NULL DEFAULT '{}',     -- bucket slugs it pulls from
  steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{type, prompt, ...}]
  output TEXT,                            -- preview output for prompts
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aperture_actions TO anon, authenticated;
GRANT ALL ON public.aperture_actions TO service_role;
ALTER TABLE public.aperture_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aperture actions readable by all"
  ON public.aperture_actions FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage aperture actions"
  ON public.aperture_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- =====================================================================
-- USER MEMORY
-- =====================================================================

CREATE TABLE public.aperture_memory_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_slug TEXT NOT NULL REFERENCES public.aperture_buckets(slug) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bucket_slug, question_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_memory_answers TO authenticated;
GRANT ALL ON public.aperture_memory_answers TO service_role;
ALTER TABLE public.aperture_memory_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own memory answers" ON public.aperture_memory_answers
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_memory_answers (user_id, bucket_slug);

CREATE TABLE public.aperture_ai_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bucket_slug TEXT,
  fact TEXT NOT NULL,
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50,
  source TEXT,                       -- 'chat' | 'playbook' | 'manual'
  source_ref UUID,                   -- chat_id, run_id, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_ai_facts TO authenticated;
GRANT ALL ON public.aperture_ai_facts TO service_role;
ALTER TABLE public.aperture_ai_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own ai facts" ON public.aperture_ai_facts
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_ai_facts (user_id, bucket_slug);

CREATE TABLE public.aperture_memory_card (
  user_id UUID PRIMARY KEY,
  summary TEXT NOT NULL DEFAULT '',
  facts_count INT NOT NULL DEFAULT 0,
  answers_count INT NOT NULL DEFAULT 0,
  regenerated_at TIMESTAMPTZ,
  stale BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_memory_card TO authenticated;
GRANT ALL ON public.aperture_memory_card TO service_role;
ALTER TABLE public.aperture_memory_card ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own memory card" ON public.aperture_memory_card
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- CHATS
-- =====================================================================

CREATE TABLE public.aperture_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  origin TEXT,                       -- 'free' | 'playbook' | 'prompt' | 'suggestion'
  origin_ref TEXT,                   -- action slug, suggestion id, etc.
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_chats TO authenticated;
GRANT ALL ON public.aperture_chats TO service_role;
ALTER TABLE public.aperture_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own chats" ON public.aperture_chats
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_chats (user_id, last_message_at DESC);

CREATE TABLE public.aperture_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.aperture_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,             -- denormalized for RLS perf
  role TEXT NOT NULL,                -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  tokens_in INT,
  tokens_out INT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_messages TO authenticated;
GRANT ALL ON public.aperture_messages TO service_role;
ALTER TABLE public.aperture_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own messages" ON public.aperture_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_messages (chat_id, created_at);

-- =====================================================================
-- ACTION RUNS (playbook progress)
-- =====================================================================

CREATE TABLE public.aperture_action_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_slug TEXT NOT NULL REFERENCES public.aperture_actions(slug) ON DELETE CASCADE,
  chat_id UUID REFERENCES public.aperture_chats(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | completed | abandoned
  current_step INT NOT NULL DEFAULT 0,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {answers: [], outputs: []}
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_action_runs TO authenticated;
GRANT ALL ON public.aperture_action_runs TO service_role;
ALTER TABLE public.aperture_action_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own action runs" ON public.aperture_action_runs
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_action_runs (user_id, status, started_at DESC);

-- =====================================================================
-- SUGGESTIONS
-- =====================================================================

CREATE TABLE public.aperture_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_slug TEXT REFERENCES public.aperture_actions(slug) ON DELETE CASCADE,
  title TEXT NOT NULL,
  reason TEXT,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  acted_on BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_suggestions TO authenticated;
GRANT ALL ON public.aperture_suggestions TO service_role;
ALTER TABLE public.aperture_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own suggestions" ON public.aperture_suggestions
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_suggestions (user_id, dismissed, score DESC);

-- =====================================================================
-- DOCUMENTS + RAG (Phase 2, schema ready)
-- =====================================================================

CREATE TABLE public.aperture_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  source TEXT,                       -- 'upload' | 'url' | 'paste'
  storage_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | ready | failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_documents TO authenticated;
GRANT ALL ON public.aperture_documents TO service_role;
ALTER TABLE public.aperture_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own documents" ON public.aperture_documents
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.aperture_doc_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.aperture_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,             -- denormalized for RLS perf
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_doc_chunks TO authenticated;
GRANT ALL ON public.aperture_doc_chunks TO service_role;
ALTER TABLE public.aperture_doc_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own doc chunks" ON public.aperture_doc_chunks
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX ON public.aperture_doc_chunks (document_id, chunk_index);
-- ivfflat index for similarity search (Phase 2 — built when we have data)
-- CREATE INDEX ON public.aperture_doc_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

CREATE TRIGGER aperture_buckets_updated_at BEFORE UPDATE ON public.aperture_buckets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_actions_updated_at BEFORE UPDATE ON public.aperture_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_memory_answers_updated_at BEFORE UPDATE ON public.aperture_memory_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_memory_card_updated_at BEFORE UPDATE ON public.aperture_memory_card
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_chats_updated_at BEFORE UPDATE ON public.aperture_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_action_runs_updated_at BEFORE UPDATE ON public.aperture_action_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER aperture_documents_updated_at BEFORE UPDATE ON public.aperture_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mark memory card stale + bump chat timestamps automatically
CREATE OR REPLACE FUNCTION public.aperture_mark_card_stale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := COALESCE(NEW.user_id, OLD.user_id);
  INSERT INTO public.aperture_memory_card (user_id, stale)
  VALUES (v_uid, true)
  ON CONFLICT (user_id) DO UPDATE SET stale = true, updated_at = now();
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER aperture_answers_stale_card
  AFTER INSERT OR UPDATE OR DELETE ON public.aperture_memory_answers
  FOR EACH ROW EXECUTE FUNCTION public.aperture_mark_card_stale();
CREATE TRIGGER aperture_facts_stale_card
  AFTER INSERT OR UPDATE OR DELETE ON public.aperture_ai_facts
  FOR EACH ROW EXECUTE FUNCTION public.aperture_mark_card_stale();

CREATE OR REPLACE FUNCTION public.aperture_bump_chat_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.aperture_chats
    SET last_message_at = NEW.created_at, updated_at = now()
    WHERE id = NEW.chat_id;
  RETURN NEW;
END $$;
CREATE TRIGGER aperture_messages_bump_chat
  AFTER INSERT ON public.aperture_messages
  FOR EACH ROW EXECUTE FUNCTION public.aperture_bump_chat_on_message();
