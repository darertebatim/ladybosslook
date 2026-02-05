-- Add display location column to promo_banners
ALTER TABLE public.promo_banners 
ADD COLUMN display_location text NOT NULL DEFAULT 'home';

-- Add target playlist IDs for player-specific targeting
ALTER TABLE public.promo_banners 
ADD COLUMN target_playlist_ids uuid[] DEFAULT '{}';

-- Create index for efficient location filtering
CREATE INDEX idx_promo_banners_location ON public.promo_banners(display_location);

-- Add comment explaining the column
COMMENT ON COLUMN public.promo_banners.display_location IS 'Where the banner appears: home, explore, listen, player, or all';
COMMENT ON COLUMN public.promo_banners.target_playlist_ids IS 'For player location: only show when listening to these playlists (empty = all)';