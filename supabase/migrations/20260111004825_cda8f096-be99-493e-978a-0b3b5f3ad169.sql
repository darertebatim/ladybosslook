-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule send-drip-notifications to run daily at 6:00 AM UTC
SELECT cron.schedule(
  'send-drip-notifications-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-drip-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule send-session-reminders to run every hour at minute 0
SELECT cron.schedule(
  'send-session-reminders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/send-session-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udWtoempjdmJ3cHZrdHhxbGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDgzNTAsImV4cCI6MjA3MTQ4NDM1MH0.1ANVDtRq40mTm4LTvbztI0HZgCDPZ_wNUO_Koa9-sxg"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);