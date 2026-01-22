-- Remove journal reminders from PN schedules since it's now handled by Pro Tasks
DELETE FROM push_notification_schedules WHERE function_name = 'send-journal-reminders';

-- Clean up any logs
DELETE FROM pn_schedule_logs WHERE function_name = 'send-journal-reminders';