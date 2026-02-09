
-- Remove the old daily-notifications hourly cron job
SELECT cron.unschedule('send-daily-notifications-hourly');

-- Add drip followup daily cron job (runs at 10 AM UTC)
SELECT cron.schedule(
  'send-drip-followup-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-drip-followup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);
