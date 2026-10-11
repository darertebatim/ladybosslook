CREATE OR REPLACE FUNCTION public.move_personal_data(_from uuid, _to uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text; n int; moved jsonb := '{}'::jsonb;
BEGIN
  IF _from IS NULL OR _to IS NULL OR _from = _to THEN RETURN moved; END IF;
  IF NOT EXISTS (SELECT 1 FROM account_family_ids(_to) f WHERE f = _from) THEN
    RAISE EXCEPTION 'accounts are not linked';
  END IF;
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name AND tb.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' AND c.column_name = 'user_id'
      AND c.table_name NOT IN ('profiles','user_roles','user_admin_permissions','account_email_aliases',
        'course_enrollments','user_subscriptions','orders','chat_conversations','security_audit_log',
        'user_wallets','learn_lesson_progress','audio_progress','video_progress','module_progress','reading_user_progress')
  LOOP
    BEGIN
      EXECUTE format('UPDATE public.%I SET user_id = $1 WHERE user_id = $2', t) USING _to, _from;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN moved := moved || jsonb_build_object(t, n); END IF;
    EXCEPTION WHEN OTHERS THEN
      moved := moved || jsonb_build_object(t, 'kept: ' || SQLERRM);
    END;
  END LOOP;
  RETURN moved;
END $$;
REVOKE ALL ON FUNCTION public.move_personal_data(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_personal_data(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.family_primary_of(_uid uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT a.primary_user_id FROM account_email_aliases a WHERE a.merged_from_user_id = _uid AND a.primary_user_id <> _uid LIMIT 1),
    (SELECT a.primary_user_id FROM account_email_aliases a JOIN profiles pr ON lower(pr.email) = lower(a.email)
      WHERE pr.id = _uid AND a.primary_user_id <> _uid LIMIT 1));
$$;
REVOKE ALL ON FUNCTION public.family_primary_of(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.family_primary_of(uuid) TO service_role;