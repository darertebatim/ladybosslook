DO $$
DECLARE t text;
BEGIN
  SELECT token INTO t FROM private.cron_secret LIMIT 1;
  IF t IS NULL THEN RAISE EXCEPTION 'cron secret not found'; END IF;

  -- Test copy now, to the owner inbox.
  PERFORM net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-casigads-lastcall',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',t),
    body := '{"test_email":"darertebatim@gmail.com"}'::jsonb
  );

  -- Real send: Fri Oct 30, 13:00 UTC = 9:00 AM Eastern / 6:00 AM Pacific. Removes itself after running.
  PERFORM cron.schedule(
    'casigads-lastcall-r4',
    '0 13 30 10 *',
    format($job$
      SELECT net.http_post(
        url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-casigads-lastcall',
        headers := '{"Content-Type": "application/json", "x-cron-secret": "%s"}'::jsonb,
        body := '{}'::jsonb,
        timeout_milliseconds := 300000
      );
      SELECT cron.unschedule('casigads-lastcall-r4');
    $job$, t)
  );
END $$;