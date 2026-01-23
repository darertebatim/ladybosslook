-- Composite index for enrollment lookups in RLS policies
-- This speeds up the EXISTS subquery in audio_playlists RLS
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_program_status 
ON course_enrollments (user_id, program_slug, status);

-- Also add index for common lookup pattern
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_status
ON course_enrollments (user_id, status);