-- Update playlist covers for audiobooks without covers
UPDATE audio_playlists 
SET cover_image_url = '/playlist-covers/ladyboss-podcast.jpg' 
WHERE id = '3e7bdfba-48d9-42e8-97da-d7846294bf6a';

UPDATE audio_playlists 
SET cover_image_url = '/playlist-covers/ready-to-empowered.jpg' 
WHERE id = 'baa9b2c7-4b0e-4d3d-9808-af4555797d8f';