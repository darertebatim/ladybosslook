ALTER TABLE public.user_tasks
ADD COLUMN IF NOT EXISTS calendar_event_id text;