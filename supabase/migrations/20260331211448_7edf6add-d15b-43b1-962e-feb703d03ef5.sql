CREATE POLICY "Users can update own AI chat messages"
  ON public.admin_ai_chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());