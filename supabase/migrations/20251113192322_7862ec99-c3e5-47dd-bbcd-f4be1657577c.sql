-- Add audio_playlist_id column to program_catalog
ALTER TABLE program_catalog 
  ADD COLUMN audio_playlist_id UUID REFERENCES audio_playlists(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_program_catalog_playlist ON program_catalog(audio_playlist_id);

-- Add comment
COMMENT ON COLUMN program_catalog.audio_playlist_id IS 'Featured playlist for this program, displayed on course detail page in app';