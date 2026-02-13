
-- Add end date configuration to routines_bank
ALTER TABLE public.routines_bank
ADD COLUMN end_mode TEXT NOT NULL DEFAULT 'never',
ADD COLUMN end_date DATE NULL,
ADD COLUMN end_after_days INTEGER NULL;

-- Add end date configuration to routine_plans
ALTER TABLE public.routine_plans
ADD COLUMN end_mode TEXT NOT NULL DEFAULT 'never',
ADD COLUMN end_date DATE NULL,
ADD COLUMN end_after_days INTEGER NULL;

-- end_mode can be: 'never', 'date', 'after_days'
