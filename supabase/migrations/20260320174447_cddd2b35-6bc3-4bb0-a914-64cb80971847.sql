
-- Add duration_minutes to user_tasks for smart estimate support
ALTER TABLE public.user_tasks ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT NULL;

-- Backfill from admin_task_bank by matching title
UPDATE public.user_tasks ut
SET duration_minutes = atb.duration_minutes
FROM public.admin_task_bank atb
WHERE ut.title = atb.title
  AND atb.duration_minutes IS NOT NULL
  AND ut.duration_minutes IS NULL;
