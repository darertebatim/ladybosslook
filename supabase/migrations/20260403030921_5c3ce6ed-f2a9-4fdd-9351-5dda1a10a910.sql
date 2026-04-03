
ALTER TABLE public.feed_channels
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS include_programs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_programs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_playlists text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_playlists text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_timezones text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_update_status text[] NOT NULL DEFAULT '{}';
