UPDATE home_banners SET is_active = false 
WHERE id IN ('73c6200f-d8fc-402b-828e-2af852e5a560', 'a6c1e6fb-442c-40da-ab77-d89d8a3c5368');

UPDATE app_settings SET value = '1.1.09' WHERE key = 'latest_ios_version';