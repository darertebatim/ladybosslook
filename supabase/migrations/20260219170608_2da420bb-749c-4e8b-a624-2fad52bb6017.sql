
-- Add monthly_day column to routines_bank_tasks for monthly tasks (1-31)
ALTER TABLE routines_bank_tasks ADD COLUMN monthly_day integer;

-- Add comment for clarity
COMMENT ON COLUMN routines_bank_tasks.monthly_day IS 'Day of month (1-31) for monthly recurring tasks';
