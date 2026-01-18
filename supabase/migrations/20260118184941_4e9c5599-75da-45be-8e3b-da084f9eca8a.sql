-- Add repeat_interval and repeat_end_date columns for enhanced repeat settings
ALTER TABLE user_tasks 
  ADD COLUMN IF NOT EXISTS repeat_interval integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS repeat_end_date date;