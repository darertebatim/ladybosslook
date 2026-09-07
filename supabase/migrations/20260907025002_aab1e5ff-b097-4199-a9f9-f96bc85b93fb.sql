ALTER TABLE public.learn_lessons
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS link_label text,
  ADD COLUMN IF NOT EXISTS session_url text,
  ADD COLUMN IF NOT EXISTS session_at timestamptz;