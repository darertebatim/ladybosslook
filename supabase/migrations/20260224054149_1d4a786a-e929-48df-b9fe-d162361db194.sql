
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT true;
