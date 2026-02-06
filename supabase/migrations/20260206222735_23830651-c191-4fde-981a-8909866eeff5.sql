-- Add wake and sleep time to notification preferences
ALTER TABLE user_notification_preferences 
ADD COLUMN IF NOT EXISTS wake_time time DEFAULT '07:00:00',
ADD COLUMN IF NOT EXISTS sleep_time time DEFAULT '22:00:00';

-- Add comment for clarity
COMMENT ON COLUMN user_notification_preferences.wake_time IS 'User wake time - no notifications before this';
COMMENT ON COLUMN user_notification_preferences.sleep_time IS 'User sleep time - no notifications after this';