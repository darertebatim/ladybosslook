-- Add cron schedule for daily notifications (morning summary, evening check-in, time periods, goal nudges)
INSERT INTO push_notification_schedules (name, function_name, schedule, description, is_active)
VALUES (
  'Daily Notifications',
  'send-daily-notifications',
  '0 * * * *',
  'Sends morning summary, evening check-in, time period reminders, and goal nudges at user-local times hourly',
  true
)
ON CONFLICT DO NOTHING;