-- Update existing 'home' display_location values to 'home_top'
UPDATE promo_banners 
SET display_location = 'home_top' 
WHERE display_location = 'home';