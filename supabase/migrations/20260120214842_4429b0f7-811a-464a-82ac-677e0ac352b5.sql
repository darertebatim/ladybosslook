-- Drop the old constraint
ALTER TABLE public.audio_playlists DROP CONSTRAINT IF EXISTS audio_playlists_category_check;

-- Update existing data from course_supplement to course
UPDATE public.audio_playlists SET category = 'course' WHERE category = 'course_supplement';

-- Add the new constraint with 'course' instead of 'course_supplement'
ALTER TABLE public.audio_playlists ADD CONSTRAINT audio_playlists_category_check 
CHECK (category IN ('audiobook', 'course', 'podcast', 'meditate', 'workout', 'soundscape', 'affirmations'));