-- Add available_on_mobile column to audio_playlists
ALTER TABLE public.audio_playlists 
ADD COLUMN available_on_mobile boolean NOT NULL DEFAULT true;