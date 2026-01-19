-- Add new self-care categories to the audio_playlists table
-- First, let's check if category is a text field or needs updating

-- Since category appears to be a text field (not an enum), we can just use these new values directly
-- But let's add a comment describing valid categories for documentation

COMMENT ON COLUMN public.audio_playlists.category IS 'Valid categories: audiobook, course_supplement, podcast, meditate, workout, soundscape, affirmations';