
-- Add schedule_type to routines_bank (admin template table)
ALTER TABLE public.routines_bank 
ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'daily';

-- Add scheduling columns to routines_bank_tasks
ALTER TABLE public.routines_bank_tasks 
ADD COLUMN schedule_days INTEGER[] DEFAULT '{}',
ADD COLUMN drip_day INTEGER DEFAULT NULL;
