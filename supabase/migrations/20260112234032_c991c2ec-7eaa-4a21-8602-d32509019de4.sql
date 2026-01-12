-- Rename youtube_url to video_url for multi-platform video support
ALTER TABLE home_banners RENAME COLUMN youtube_url TO video_url;