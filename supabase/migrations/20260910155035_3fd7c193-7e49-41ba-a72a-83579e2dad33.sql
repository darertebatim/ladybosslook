
-- 1. Canned / ready replies
CREATE TABLE public.support_canned_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  buttons JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'General',
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_canned_replies TO authenticated;
GRANT ALL ON public.support_canned_replies TO service_role;

ALTER TABLE public.support_canned_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage canned replies"
ON public.support_canned_replies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.can_access_admin_page(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.can_access_admin_page(auth.uid(), 'support'));

-- 2. Internal notes
CREATE TABLE public.chat_internal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_internal_notes_conversation ON public.chat_internal_notes(conversation_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_internal_notes TO authenticated;
GRANT ALL ON public.chat_internal_notes TO service_role;

ALTER TABLE public.chat_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage internal notes"
ON public.chat_internal_notes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.can_access_admin_page(auth.uid(), 'support'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.can_access_admin_page(auth.uid(), 'support'));

-- 3. Conversation workflow columns
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 4. Message buttons
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS buttons JSONB;

-- 5. updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_support_canned_replies_updated_at
BEFORE UPDATE ON public.support_canned_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_internal_notes_updated_at
BEFORE UPDATE ON public.chat_internal_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed a few starter ready messages
INSERT INTO public.support_canned_replies (title, body, category, language, sort_order) VALUES
('Greeting', 'Hi {first_name}! How can I help you today?', 'Welcome', 'en', 1),
('Looking into it', 'Thank you for reaching out. Let me look into this for you.', 'General', 'en', 2),
('Need details', 'Could you please share a bit more detail about the issue?', 'General', 'en', 3),
('Resolved', 'I''ve resolved this issue. Is there anything else I can help with?', 'Closing', 'en', 4),
('Program access', 'You can find it in the app under My Program. Open Rilo, go to My Program and tap the program to start.', 'Access', 'en', 5);
