-- Allow non-enrolled users to DISCOVER iOS-visible playlists (without granting access to the audio files)
-- This fixes the Listen page showing only free/enrolled playlists.

DROP POLICY IF EXISTS "Enrolled users can view course playlists" ON public.audio_playlists;

CREATE POLICY "Users can discover iOS-visible playlists"
ON public.audio_playlists
FOR SELECT
TO public
USING (
  (is_hidden = false OR has_role(auth.uid(), 'admin'::app_role))
  AND (
    program_slug IS NULL
    OR is_free = true
    OR available_on_mobile = true
    OR EXISTS (
      SELECT 1
      FROM public.course_enrollments ce
      WHERE ce.user_id = auth.uid()
        AND ce.program_slug = audio_playlists.program_slug
        AND ce.status = 'active'
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);