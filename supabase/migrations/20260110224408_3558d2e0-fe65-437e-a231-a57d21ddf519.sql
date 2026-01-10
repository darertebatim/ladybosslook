-- Add drip_delay_days column to audio_playlist_items for drip content scheduling
ALTER TABLE audio_playlist_items 
ADD COLUMN drip_delay_days integer NOT NULL DEFAULT 0;

-- Add a comment explaining the field
COMMENT ON COLUMN audio_playlist_items.drip_delay_days IS 
  'Number of days after round start_date when this track becomes available. 0 = immediate access';