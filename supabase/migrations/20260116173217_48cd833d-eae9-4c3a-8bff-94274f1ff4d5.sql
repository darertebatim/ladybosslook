-- Add drip content support to playlist_supplements
ALTER TABLE playlist_supplements 
ADD COLUMN drip_delay_days INTEGER NOT NULL DEFAULT 0;

-- Add optional audio reference for audio-type modules
ALTER TABLE playlist_supplements 
ADD COLUMN audio_id UUID REFERENCES audio_content(id) ON DELETE SET NULL;

-- Add display mode to audio_playlists table (tracks, modules, or both)
ALTER TABLE audio_playlists 
ADD COLUMN display_mode TEXT NOT NULL DEFAULT 'tracks';

-- Add check constraint for display_mode values
ALTER TABLE audio_playlists 
ADD CONSTRAINT audio_playlists_display_mode_check 
CHECK (display_mode IN ('tracks', 'modules', 'both'));

-- Create module_progress table for tracking video/pdf/link progress
CREATE TABLE module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_id UUID NOT NULL REFERENCES playlist_supplements(id) ON DELETE CASCADE,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, supplement_id)
);

-- Enable RLS on module_progress
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own module progress"
ON module_progress FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own module progress"
ON module_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own module progress"
ON module_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_module_progress_user_supplement ON module_progress(user_id, supplement_id);