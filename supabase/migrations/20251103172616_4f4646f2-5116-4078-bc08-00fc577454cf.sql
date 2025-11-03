-- Add cover_image_url column to audio_playlists table
ALTER TABLE audio_playlists
ADD COLUMN cover_image_url TEXT;