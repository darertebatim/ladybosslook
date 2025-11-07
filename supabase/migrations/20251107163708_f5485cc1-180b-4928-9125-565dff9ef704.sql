-- Fix RLS policies to properly hide playlists marked as hidden
-- Drop the overly permissive policy that doesn't check is_hidden
DROP POLICY IF EXISTS "Anyone can view free playlists" ON audio_playlists;

-- The "Enrolled users can view course playlists" policy already handles all cases
-- including free playlists, and it properly checks is_hidden
-- No additional policy needed since the existing one covers:
-- 1. Hidden check: (is_hidden = false OR admin)
-- 2. Access check: (program_slug IS NULL OR is_free OR enrolled OR admin)