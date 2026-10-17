DO $migration$
DECLARE
  v_definition text;
  v_old text := 'v_user_id := coalesce(public.family_primary_of(v_user_id), v_user_id);';
  v_new text := 'v_user_id := coalesce(
    (SELECT a.primary_user_id FROM public.account_email_aliases a WHERE a.merged_from_user_id = v_user_id AND a.primary_user_id <> v_user_id LIMIT 1),
    (SELECT a.primary_user_id FROM public.account_email_aliases a JOIN public.profiles pr ON lower(pr.email) = lower(a.email) WHERE pr.id = v_user_id AND a.primary_user_id <> v_user_id LIMIT 1),
    v_user_id
  );';
BEGIN
  SELECT pg_get_functiondef('public.record_manual_payment(uuid,text,text,text,text,integer,text,text,timestamptz,text,text,boolean,uuid)'::regprocedure) INTO v_definition;
  IF position(v_old IN v_definition) = 0 THEN
    RAISE EXCEPTION 'Expected manual-payment account lookup not found';
  END IF;
  EXECUTE replace(v_definition, v_old, v_new);
  IF (SELECT prosecdef FROM pg_proc WHERE oid = 'public.record_manual_payment(uuid,text,text,text,text,integer,text,text,timestamptz,text,text,boolean,uuid)'::regprocedure) THEN
    RAISE EXCEPTION 'Manual payments must retain security invoker';
  END IF;
END;
$migration$;