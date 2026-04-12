
ALTER TABLE public.home_banners
  ADD COLUMN IF NOT EXISTS destination_type text DEFAULT 'custom_url',
  ADD COLUMN IF NOT EXISTS destination_id text,
  ADD COLUMN IF NOT EXISTS display_frequency text DEFAULT 'forever',
  ADD COLUMN IF NOT EXISTS display_location text[] DEFAULT '{home_top}',
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS include_programs text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_programs text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_playlists text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_playlists text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_tools text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS exclude_tools text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS include_update_status text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_delay_seconds integer DEFAULT 0;
