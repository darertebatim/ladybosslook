-- Add category to audio_playlists
ALTER TABLE audio_playlists 
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('audiobook', 'course_supplement', 'podcast'));

-- Update audio_content RLS policies to check playlist access instead
DROP POLICY IF EXISTS "Enrolled users can view course audio" ON audio_content;
DROP POLICY IF EXISTS "Anyone can view free audio content" ON audio_content;

-- New policy: Users can view audio if they have access to any playlist containing it
CREATE POLICY "Users can view audio in accessible playlists"
ON audio_content
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 
    FROM audio_playlist_items api
    JOIN audio_playlists ap ON ap.id = api.playlist_id
    WHERE api.audio_id = audio_content.id
    AND (
      ap.is_free = true OR
      EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE user_id = auth.uid()
        AND program_slug = ap.program_slug
        AND status = 'active'
      )
    )
  )
);