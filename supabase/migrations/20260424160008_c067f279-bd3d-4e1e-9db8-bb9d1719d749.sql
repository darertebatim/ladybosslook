-- ============================================================
-- Server-side enforcement of feed channel audience rules
-- ============================================================
-- Previously, audience filtering (instructor referrals, languages,
-- timezones, app-version, tools, programs) was done CLIENT-SIDE only
-- in src/hooks/useFeed.tsx. Old app versions bypass this filter and
-- can both read and post in restricted channels.
--
-- This migration centralizes the audience check in a SQL function and
-- enforces it via RLS on feed_channels (SELECT) and feed_posts (SELECT
-- + INSERT). Existing posts are intentionally preserved.
-- ============================================================

-- 1. Audience access function ---------------------------------
CREATE OR REPLACE FUNCTION public.has_channel_access(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel record;
  v_user_lang text;
  v_user_tz text;
  v_user_version text;
  v_latest_ios text;
  v_latest_android text;
  v_platform text;
  v_is_latest boolean;
BEGIN
  IF _user_id IS NULL OR _channel_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admins always have access
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;

  SELECT
    fc.id, fc.type, fc.is_archived, fc.program_slug, fc.round_id,
    fc.target_type, fc.target_instructor_ids, fc.target_languages,
    fc.target_timezones, fc.include_update_status,
    fc.include_tools, fc.exclude_tools,
    fc.include_programs, fc.exclude_programs,
    fc.include_playlists, fc.exclude_playlists
    INTO v_channel
  FROM feed_channels fc
  WHERE fc.id = _channel_id;

  IF NOT FOUND OR v_channel.is_archived THEN
    RETURN false;
  END IF;

  -- Channel-type access (mirrors original SELECT policy on feed_channels)
  IF v_channel.type = 'general' THEN
    NULL; -- accessible to everyone
  ELSIF v_channel.type = 'all_enrolled' THEN
    IF NOT EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.user_id = _user_id AND ce.status = 'active'
    ) THEN RETURN false; END IF;
  ELSIF v_channel.type = 'all_paid' THEN
    IF NOT EXISTS (
      SELECT 1 FROM orders o
      WHERE o.user_id = _user_id AND o.status = 'completed'
    ) THEN RETURN false; END IF;
  ELSIF v_channel.type = 'program' THEN
    IF NOT EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.user_id = _user_id AND ce.program_slug = v_channel.program_slug
    ) THEN RETURN false; END IF;
  ELSIF v_channel.type = 'round' THEN
    IF NOT EXISTS (
      SELECT 1 FROM course_enrollments ce
      WHERE ce.user_id = _user_id AND ce.round_id = v_channel.round_id
    ) THEN RETURN false; END IF;
  END IF;

  -- Instructor-scoped audience
  IF v_channel.target_instructor_ids IS NOT NULL
     AND array_length(v_channel.target_instructor_ids, 1) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM instructor_referrals ir
      WHERE ir.user_id = _user_id
        AND ir.instructor_id = ANY(v_channel.target_instructor_ids)
    ) THEN RETURN false; END IF;
  END IF;

  -- Language-scoped audience
  IF v_channel.target_languages IS NOT NULL
     AND array_length(v_channel.target_languages, 1) > 0 THEN
    SELECT preferred_language INTO v_user_lang
    FROM profiles WHERE id = _user_id;
    IF v_user_lang IS NULL OR NOT (v_user_lang = ANY(v_channel.target_languages)) THEN
      RETURN false;
    END IF;
  END IF;

  -- Timezone-scoped audience
  IF v_channel.target_timezones IS NOT NULL
     AND array_length(v_channel.target_timezones, 1) > 0 THEN
    SELECT timezone INTO v_user_tz
    FROM profiles WHERE id = _user_id;
    IF v_user_tz IS NULL OR NOT (v_user_tz = ANY(v_channel.target_timezones)) THEN
      RETURN false;
    END IF;
  END IF;

  -- App-version (update-status) gate: 'latest' / 'previous'
  IF v_channel.include_update_status IS NOT NULL
     AND array_length(v_channel.include_update_status, 1) > 0 THEN
    SELECT app_version, platform INTO v_user_version, v_platform
    FROM app_installations
    WHERE user_id = _user_id
    ORDER BY last_seen_at DESC NULLS LAST
    LIMIT 1;

    SELECT value INTO v_latest_ios FROM app_settings WHERE key = 'latest_ios_version';
    SELECT value INTO v_latest_android FROM app_settings WHERE key = 'latest_android_version';

    v_is_latest := CASE
      WHEN v_user_version IS NULL THEN false
      WHEN v_platform = 'ios' THEN v_user_version = v_latest_ios
      WHEN v_platform = 'android' THEN v_user_version = v_latest_android
      ELSE false
    END;

    IF v_is_latest AND NOT ('latest' = ANY(v_channel.include_update_status)) THEN
      RETURN false;
    END IF;
    IF NOT v_is_latest AND NOT ('previous' = ANY(v_channel.include_update_status)) THEN
      RETURN false;
    END IF;
  END IF;

  -- User-level exclusion list always wins
  IF EXISTS (
    SELECT 1 FROM feed_channel_exclusions
    WHERE user_id = _user_id AND channel_id = _channel_id
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 2. Replace SELECT policy on feed_channels -------------------
DROP POLICY IF EXISTS "Users can view accessible channels" ON public.feed_channels;

CREATE POLICY "Users can view accessible channels"
ON public.feed_channels
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.has_channel_access(auth.uid(), id)
);

-- 3. Replace SELECT + INSERT policies on feed_posts -----------
DROP POLICY IF EXISTS "Users can view posts in accessible channels" ON public.feed_posts;
DROP POLICY IF EXISTS "Users can post in group channels" ON public.feed_posts;

CREATE POLICY "Users can view posts in accessible channels"
ON public.feed_posts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR public.has_channel_access(auth.uid(), channel_id)
);

CREATE POLICY "Users can post in group channels"
ON public.feed_posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND author_id = auth.uid()
  AND post_type = 'discussion'
  AND is_system = false
  AND EXISTS (
    SELECT 1 FROM feed_channels fc
    WHERE fc.id = feed_posts.channel_id
      AND fc.allow_comments = true
  )
  AND public.has_channel_access(auth.uid(), channel_id)
);