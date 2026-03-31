CREATE TABLE public.admin_ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_ai_chat_user ON public.admin_ai_chat_messages(user_id, created_at);

ALTER TABLE public.admin_ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages
CREATE POLICY "Users can read own AI chat messages"
  ON public.admin_ai_chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own messages
CREATE POLICY "Users can insert own AI chat messages"
  ON public.admin_ai_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own messages (for clear history)
CREATE POLICY "Users can delete own AI chat messages"
  ON public.admin_ai_chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());