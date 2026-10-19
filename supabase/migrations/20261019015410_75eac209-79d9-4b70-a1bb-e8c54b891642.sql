DO $$
DECLARE t text; j record;
BEGIN
  SELECT token INTO t FROM private.cron_secret LIMIT 1;
  IF t IS NULL THEN RAISE EXCEPTION 'cron secret not found'; END IF;
  FOR j IN SELECT * FROM (VALUES
    ('startads-invite-mon', '0 15 19 10 *', ARRAY['invite']),
    ('startads-tue', '0 16 20 10 *', ARRAY['focus','proof']),
    ('startads-wed', '0 16 21 10 *', ARRAY['urgency','freedom'])
  ) v(name, sched, kinds) LOOP
    PERFORM cron.schedule(j.name, j.sched, format($job$
      SELECT net.http_post(
        url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-startads-campaign',
        headers := '{"Content-Type": "application/json", "x-cron-secret": "%1$s"}'::jsonb,
        body := jsonb_build_object('kind', k),
        timeout_milliseconds := 300000
      ) FROM unnest(%2$L::text[]) k;
      SELECT cron.unschedule(%3$L);
    $job$, t, j.kinds, j.name));
  END LOOP;
END $$;