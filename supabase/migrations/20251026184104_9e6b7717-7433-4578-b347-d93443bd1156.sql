-- Add audio_playlist_id column to program_rounds
ALTER TABLE program_rounds
ADD COLUMN audio_playlist_id uuid REFERENCES audio_playlists(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_program_rounds_audio_playlist ON program_rounds(audio_playlist_id);