-- Add time_period column to user_tasks table
-- Valid values: 'start_of_day', 'morning', 'afternoon', 'evening', 'night'
-- NULL means either "Anytime" (if scheduled_time is also NULL) or "Specific Time" (if scheduled_time is set)
ALTER TABLE user_tasks 
ADD COLUMN time_period TEXT DEFAULT NULL;

-- Add time_period column to admin_task_bank table for template consistency
ALTER TABLE admin_task_bank 
ADD COLUMN time_period TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_tasks.time_period IS 'Approximate time of day category: start_of_day, morning, afternoon, evening, night. NULL with scheduled_time means specific time, NULL without means anytime.';
COMMENT ON COLUMN admin_task_bank.time_period IS 'Approximate time of day category for task templates: start_of_day, morning, afternoon, evening, night.';