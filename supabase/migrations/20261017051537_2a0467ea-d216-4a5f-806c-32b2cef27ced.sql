ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS timezone text;

DO $$
DECLARE t text;
BEGIN
  SELECT token INTO t FROM private.cron_secret LIMIT 1;
  IF t IS NULL THEN
    RAISE EXCEPTION 'cron secret not found';
  END IF;
  PERFORM cron.schedule(
    'send-webinar-day-emails-hourly',
    '20 * * * *',
    format($job$
      SELECT net.http_post(
        url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-webinar-day-emails',
        headers := '{"Content-Type": "application/json", "x-cron-secret": "%s"}'::jsonb,
        body := '{}'::jsonb
      ) as request_id;
    $job$, t)
  );
END $$;