-- Add is_hidden column to audio_playlists table
ALTER TABLE audio_playlists 
ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- Update RLS policy to exclude hidden playlists for non-admin users
DROP POLICY IF EXISTS "Enrolled users can view course playlists" ON audio_playlists;

CREATE POLICY "Enrolled users can view course playlists" 
ON audio_playlists 
FOR SELECT 
USING (
  (is_hidden = false OR has_role(auth.uid(), 'admin'::app_role))
  AND (
    (program_slug IS NULL) 
    OR (is_free = true) 
    OR (EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.user_id = auth.uid() 
      AND course_enrollments.program_slug = audio_playlists.program_slug 
      AND course_enrollments.status = 'active'
    )) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);