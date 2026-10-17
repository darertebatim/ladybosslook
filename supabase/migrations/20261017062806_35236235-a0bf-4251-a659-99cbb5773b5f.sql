CREATE OR REPLACE FUNCTION public.refresh_webinar_exact_email_jobs(p_round_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
DECLARE
  r record;
  j record;
  kind text;
  due_at timestamptz;
  run_at timestamptz;
  job_name text;
  template_command text;
  send_command text;
  callback_command text;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname IN ('webinar-exact-' || p_round_id || '-onehour', 'webinar-exact-' || p_round_id || '-start') LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
  SELECT id, program_slug, first_session_date INTO r FROM public.program_rounds WHERE id = p_round_id;
  IF NOT FOUND OR r.program_slug <> 'igadsfree' OR r.first_session_date IS NULL THEN RETURN; END IF;
  SELECT command INTO template_command FROM cron.job WHERE jobname = 'send-webinar-day-emails-hourly' AND active LIMIT 1;
  IF template_command IS NULL THEN RAISE EXCEPTION 'Existing authenticated webinar schedule is missing'; END IF;
  FOREACH kind IN ARRAY ARRAY['onehour','start'] LOOP
    due_at := r.first_session_date - CASE WHEN kind = 'onehour' THEN interval '1 hour' ELSE interval '0' END;
    IF due_at <= now() THEN CONTINUE; END IF;
    run_at := date_trunc('minute', due_at);
    IF run_at < due_at THEN run_at := run_at + interval '1 minute'; END IF;
    job_name := 'webinar-exact-' || p_round_id || '-' || kind;
    send_command := replace(template_command, '''{}''::jsonb', quote_literal(jsonb_build_object('round_id',p_round_id,'kind',kind)::text) || '::jsonb');
    IF send_command = template_command THEN RAISE EXCEPTION 'Unexpected webinar callback template'; END IF;
    send_command := regexp_replace(send_command, 'SELECT\s+net.http_post', 'PERFORM net.http_post', 'i');
    send_command := regexp_replace(send_command, '\s+as\s+request_id', '', 'i');
    callback_command := format('DO $dispatch$ BEGIN IF now() >= %L::timestamptz AND now() < %L::timestamptz + interval ''5 minutes'' THEN %s END IF; PERFORM cron.unschedule(%L); END $dispatch$;', due_at, due_at, send_command, job_name);
    PERFORM cron.schedule(job_name, format('%s %s %s %s *', extract(minute FROM run_at AT TIME ZONE 'UTC')::int, extract(hour FROM run_at AT TIME ZONE 'UTC')::int, extract(day FROM run_at AT TIME ZONE 'UTC')::int, extract(month FROM run_at AT TIME ZONE 'UTC')::int), callback_command);
  END LOOP;
END $fn$;
REVOKE ALL ON FUNCTION public.refresh_webinar_exact_email_jobs(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_webinar_exact_email_jobs(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_webinar_exact_email_jobs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_webinar_exact_email_jobs(OLD.id);
    RETURN OLD;
  END IF;
  PERFORM public.refresh_webinar_exact_email_jobs(NEW.id);
  RETURN NEW;
END $fn$;
REVOKE ALL ON FUNCTION public.sync_webinar_exact_email_jobs() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_webinar_exact_email_jobs
AFTER INSERT OR UPDATE OF first_session_date, program_slug OR DELETE ON public.program_rounds
FOR EACH ROW EXECUTE FUNCTION public.sync_webinar_exact_email_jobs();
DO $backfill$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.program_rounds WHERE program_slug = 'igadsfree' AND first_session_date > now() LOOP
    PERFORM public.refresh_webinar_exact_email_jobs(r.id);
  END LOOP;
END $backfill$;