-- Add audience targeting columns to promo_banners
ALTER TABLE promo_banners 
ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'all',
ADD COLUMN IF NOT EXISTS include_programs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclude_programs text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS include_playlists uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclude_playlists uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS include_tools text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exclude_tools text[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN promo_banners.target_type IS 'all, enrolled, or custom';
COMMENT ON COLUMN promo_banners.include_programs IS 'Array of program slugs to include';
COMMENT ON COLUMN promo_banners.exclude_programs IS 'Array of program slugs to exclude';
COMMENT ON COLUMN promo_banners.include_playlists IS 'Array of playlist IDs to include users who accessed';
COMMENT ON COLUMN promo_banners.exclude_playlists IS 'Array of playlist IDs to exclude users who accessed';
COMMENT ON COLUMN promo_banners.include_tools IS 'Array of tool slugs: journal, breathe, water, emotion, period, planner';
COMMENT ON COLUMN promo_banners.exclude_tools IS 'Array of tool slugs to exclude users who used';