ALTER TABLE public.audience_presets
  ADD COLUMN IF NOT EXISTS include_forms text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_forms text[] NOT NULL DEFAULT '{}';