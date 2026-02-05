-- Add aspect_ratio column to promo_banners
ALTER TABLE promo_banners 
ADD COLUMN IF NOT EXISTS aspect_ratio text NOT NULL DEFAULT '3:1';

-- Add comment for documentation
COMMENT ON COLUMN promo_banners.aspect_ratio IS 'Banner aspect ratio: 3:1, 16:9, or 1:1';