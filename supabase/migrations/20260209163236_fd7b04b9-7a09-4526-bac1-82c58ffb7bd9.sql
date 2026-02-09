-- Update drip followup from daily to every 2 hours
SELECT cron.unschedule('send-drip-followup-daily');

SELECT cron.schedule(
  'send-drip-followup-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-drip-followup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Add momentum keeper every 2 hours
SELECT cron.schedule(
  'send-momentum-celebration-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-momentum-celebration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Add streak challenges every 2 hours
SELECT cron.schedule(
  'send-streak-challenges-2h',
  '0 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-streak-challenges',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);