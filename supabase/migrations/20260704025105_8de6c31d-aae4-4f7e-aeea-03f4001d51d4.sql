-- Full aperture reset function. Dynamically wipes any table in the public
-- schema whose name starts with 'aperture_' and has a user_id column, so
-- future aperture_* tables are covered automatically without editing this.
CREATE OR REPLACE FUNCTION public.aperture_full_reset(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_sql text;
  v_deleted bigint;
  v_results jsonb := '{}'::jsonb;
  v_chat_ids uuid[];
  v_doc_ids uuid[];
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id required';
  END IF;

  -- Handle FK chains first: messages -> chats, doc_chunks -> documents.
  SELECT COALESCE(array_agg(id), '{}') INTO v_chat_ids
    FROM public.aperture_chats WHERE user_id = p_user_id;
  IF array_length(v_chat_ids, 1) > 0 THEN
    DELETE FROM public.aperture_messages WHERE chat_id = ANY(v_chat_ids);
  END IF;

  SELECT COALESCE(array_agg(id), '{}') INTO v_doc_ids
    FROM public.aperture_documents WHERE user_id = p_user_id;
  IF array_length(v_doc_ids, 1) > 0 THEN
    DELETE FROM public.aperture_doc_chunks WHERE document_id = ANY(v_doc_ids);
  END IF;

  -- Sweep every aperture_* table that has a user_id column.
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'user_id'
      AND c.table_name LIKE 'aperture\_%' ESCAPE '\'
      AND t.table_type = 'BASE TABLE'
  LOOP
    v_sql := format('DELETE FROM public.%I WHERE user_id = $1', r.table_name);
    EXECUTE v_sql USING p_user_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_results := v_results || jsonb_build_object(r.table_name, v_deleted);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'user_id', p_user_id, 'deleted', v_results);
END;
$$;

REVOKE ALL ON FUNCTION public.aperture_full_reset(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aperture_full_reset(uuid) TO service_role;