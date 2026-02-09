-- Remove the task reminders cron job (now handled 100% by local notifications)
SELECT cron.unschedule('send-task-reminders-every-5-min');