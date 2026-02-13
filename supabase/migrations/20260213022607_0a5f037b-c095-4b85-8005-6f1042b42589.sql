-- Stagger cron jobs to prevent simultaneous push notifications
-- Drip stays at :00, Momentum moves to :20, Streak moves to :40

SELECT cron.unschedule('send-momentum-celebration-2h');
SELECT cron.unschedule('send-streak-challenges-2h');

SELECT cron.schedule(
  'send-momentum-celebration-2h',
  '20 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-momentum-celebration',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'send-streak-challenges-2h',
  '40 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-streak-challenges',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);