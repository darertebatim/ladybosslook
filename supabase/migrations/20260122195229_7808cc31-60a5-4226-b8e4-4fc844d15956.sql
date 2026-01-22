-- Update drip notifications to run hourly (timezone-aware based on first_session_date)
UPDATE push_notification_schedules 
SET schedule = '0 * * * *', 
    description = 'Notifies users when new audio lessons unlock (at first_session_date time each day)'
WHERE function_name = 'send-drip-notifications';

-- Update weekly summary to run hourly (checks user timezone for Monday 9 AM)
UPDATE push_notification_schedules 
SET schedule = '0 * * * *', 
    description = 'Sends weekly engagement stats every Monday at 9 AM in user''s local timezone'
WHERE function_name = 'send-weekly-summary';