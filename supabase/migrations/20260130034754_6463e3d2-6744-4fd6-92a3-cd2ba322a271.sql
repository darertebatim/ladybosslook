-- Add missing fields to admin_task_bank to match app task templates
ALTER TABLE public.admin_task_bank
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_admin_task_bank_category ON public.admin_task_bank(category);