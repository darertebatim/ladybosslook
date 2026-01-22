-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule task reminders to run every 5 minutes
SELECT cron.schedule(
  'send-task-reminders-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-task-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);