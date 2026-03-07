
-- Fix RLS on audio_playlist_items: allow simora-plus subscribers to access requires_subscription playlists
DROP POLICY IF EXISTS "Users can view playlist items they have access to" ON audio_playlist_items;
CREATE POLICY "Users can view playlist items they have access to"
ON audio_playlist_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM audio_playlists
    WHERE audio_playlists.id = audio_playlist_items.playlist_id
    AND (
      audio_playlists.is_free = true
      OR (audio_playlists.program_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.user_id = auth.uid()
        AND course_enrollments.program_slug = audio_playlists.program_slug
        AND course_enrollments.status = 'active'
      ))
      OR (audio_playlists.requires_subscription = true AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.user_id = auth.uid()
        AND course_enrollments.program_slug = 'simora-plus'
        AND course_enrollments.status = 'active'
      ))
      OR (audio_playlists.requires_subscription = true AND EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_subscriptions.user_id = auth.uid()
        AND user_subscriptions.program_slug = 'simora-plus'
        AND user_subscriptions.status = 'active'
      ))
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

-- Fix RLS on audio_content: allow simora-plus subscribers to access audio in requires_subscription playlists
DROP POLICY IF EXISTS "Users can view audio in accessible playlists" ON audio_content;
CREATE POLICY "Users can view audio in accessible playlists"
ON audio_content FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM audio_playlist_items api
    JOIN audio_playlists ap ON ap.id = api.playlist_id
    WHERE api.audio_id = audio_content.id
    AND (
      ap.is_free = true
      OR (ap.program_slug IS NOT NULL AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.user_id = auth.uid()
        AND course_enrollments.program_slug = ap.program_slug
        AND course_enrollments.status = 'active'
      ))
      OR (ap.requires_subscription = true AND EXISTS (
        SELECT 1 FROM course_enrollments
        WHERE course_enrollments.user_id = auth.uid()
        AND course_enrollments.program_slug = 'simora-plus'
        AND course_enrollments.status = 'active'
      ))
      OR (ap.requires_subscription = true AND EXISTS (
        SELECT 1 FROM user_subscriptions
        WHERE user_subscriptions.user_id = auth.uid()
        AND user_subscriptions.program_slug = 'simora-plus'
        AND user_subscriptions.status = 'active'
      ))
    )
  )
);
