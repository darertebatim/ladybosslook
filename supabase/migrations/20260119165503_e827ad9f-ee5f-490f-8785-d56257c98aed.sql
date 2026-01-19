-- Drop the existing check constraint and add a new one with all categories
ALTER TABLE public.audio_playlists DROP CONSTRAINT IF EXISTS audio_playlists_category_check;

ALTER TABLE public.audio_playlists ADD CONSTRAINT audio_playlists_category_check 
CHECK (category IN ('audiobook', 'course_supplement', 'podcast', 'meditate', 'workout', 'soundscape', 'affirmations'));