DO $$
DECLARE
  v_uid uuid := '037d7614-a7c4-4f42-a358-3b435c2dc1d9';
BEGIN
  DELETE FROM public.aperture_memory_items WHERE user_id = v_uid;
  DELETE FROM public.aperture_memory_card WHERE user_id = v_uid;
  DELETE FROM public.aperture_messages WHERE chat_id IN (SELECT id FROM public.aperture_chats WHERE user_id = v_uid);
  DELETE FROM public.aperture_chats WHERE user_id = v_uid;
  DELETE FROM public.aperture_generated_items WHERE user_id = v_uid;
  DELETE FROM public.aperture_action_runs WHERE user_id = v_uid;
  DELETE FROM public.aperture_user_tools WHERE user_id = v_uid;
  DELETE FROM public.aperture_files WHERE user_id = v_uid;
  DELETE FROM public.aperture_doc_chunks WHERE document_id IN (SELECT id FROM public.aperture_documents WHERE user_id = v_uid);
  DELETE FROM public.aperture_documents WHERE user_id = v_uid;
  DELETE FROM public.aperture_events WHERE user_id = v_uid;
  DELETE FROM public.aperture_user_profile WHERE user_id = v_uid;
END $$;