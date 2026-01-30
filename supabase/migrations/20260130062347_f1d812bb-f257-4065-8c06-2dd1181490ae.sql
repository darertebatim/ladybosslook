-- Add repeat_interval column to admin_task_bank for parity with user tasks
ALTER TABLE admin_task_bank 
ADD COLUMN IF NOT EXISTS repeat_interval integer DEFAULT 1;