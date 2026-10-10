CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  SELECT user_id INTO _owner FROM chat_conversations WHERE id = _conversation_id;
  IF _owner IS NULL THEN RETURN; END IF;
  IF auth.uid() = _owner THEN
    UPDATE chat_messages SET is_read = true
     WHERE conversation_id = _conversation_id AND is_read = false AND sender_type <> 'user';
  ELSIF has_role(auth.uid(), 'admin') OR can_access_admin_page(auth.uid(), 'support') THEN
    UPDATE chat_messages SET is_read = true
     WHERE conversation_id = _conversation_id AND is_read = false AND sender_type = 'user';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;