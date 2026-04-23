
-- 1. Allow playlist_save and playlist_update in completions table
ALTER TABLE public.planner_program_completions
  DROP CONSTRAINT IF EXISTS planner_program_completions_event_type_check;

ALTER TABLE public.planner_program_completions
  ADD CONSTRAINT planner_program_completions_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'session'::text,
    'module'::text,
    'track'::text,
    'enrollment'::text,
    'playlist_save'::text,
    'playlist_update'::text
  ]));

-- 2. Read-tracking table for playlist update notifications
CREATE TABLE IF NOT EXISTS public.playlist_update_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL,
  audio_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, playlist_id, audio_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_update_reads_user
  ON public.playlist_update_notification_reads(user_id);

ALTER TABLE public.playlist_update_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own playlist update reads"
  ON public.playlist_update_notification_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own playlist update reads"
  ON public.playlist_update_notification_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own playlist update reads"
  ON public.playlist_update_notification_reads
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all playlist update reads"
  ON public.playlist_update_notification_reads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Update RPC to include playlist events
CREATE OR REPLACE FUNCTION public.get_program_events_for_date(p_user_id uuid, p_date_str text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_date date;
  v_day_start timestamptz;
  v_day_end timestamptz;
BEGIN
  v_date := p_date_str::date;
  v_day_start := (v_date - interval '1 day')::timestamptz;
  v_day_end := (v_date + interval '2 days')::timestamptz;

  WITH active_enrollments AS (
    SELECT 
      ce.id as enrollment_id,
      ce.program_slug,
      ce.course_name,
      ce.round_id,
      ce.enrolled_at,
      ce.enrolled_at::text as enrolled_at_text,
      pr.id as round_db_id,
      pr.first_session_date::text as first_session_date_text,
      pr.drip_offset_days,
      pr.audio_playlist_id,
      pr.is_self_paced,
      pr.google_meet_link
    FROM course_enrollments ce
    LEFT JOIN program_rounds pr ON pr.id = ce.round_id
    WHERE ce.user_id = p_user_id AND ce.status = 'active'
  ),
  completions AS (
    SELECT event_type, event_id
    FROM planner_program_completions
    WHERE user_id = p_user_id AND completed_date = v_date
  ),
  catalog AS (
    SELECT slug, title FROM program_catalog
  ),
  -- Programs the user has Simora Plus subscription access to
  has_plus AS (
    SELECT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = p_user_id
        AND program_slug = 'simora-plus'
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
    ) as is_plus
  ),
  -- All playlists the user has access to (saves + program enrollments + plus)
  accessible_playlists AS (
    -- Free saves
    SELECT 
      ps.playlist_id,
      ps.saved_at as access_started_at
    FROM playlist_saves ps
    WHERE ps.user_id = p_user_id
    UNION
    -- Via active program enrollment (round.audio_playlist_id)
    SELECT 
      ae.audio_playlist_id as playlist_id,
      ae.enrolled_at as access_started_at
    FROM active_enrollments ae
    WHERE ae.audio_playlist_id IS NOT NULL
    UNION
    -- Via simora-plus for requires_subscription playlists
    SELECT 
      apl.id as playlist_id,
      (SELECT MIN(us.created_at) FROM user_subscriptions us 
       WHERE us.user_id = p_user_id AND us.program_slug = 'simora-plus' AND us.status = 'active') as access_started_at
    FROM audio_playlists apl, has_plus
    WHERE apl.requires_subscription = true AND has_plus.is_plus = true
  ),
  round_sessions AS (
    SELECT 
      ps.id, ps.round_id, ps.title, ps.session_date, ps.session_number, ps.meeting_link
    FROM program_sessions ps
    INNER JOIN active_enrollments ae ON ae.round_db_id = ps.round_id
    WHERE ps.session_date >= v_day_start AND ps.session_date < v_day_end
  ),
  session_events AS (
    SELECT jsonb_build_object(
      'id', rs.id, 'type', 'session', 'title', rs.title,
      'programSlug', COALESCE(ae.program_slug, ''),
      'programTitle', COALESCE(c.title, ae.course_name),
      'roundId', ae.round_db_id,
      'time', to_char(rs.session_date AT TIME ZONE 'UTC', 'HH12:MI AM'),
      'sessionDate', rs.session_date,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'session' AND comp.event_id = rs.id),
      'meetingLink', COALESCE(rs.meeting_link, ae.google_meet_link),
      'sessionNumber', rs.session_number
    ) as event
    FROM round_sessions rs
    INNER JOIN active_enrollments ae ON ae.round_db_id = rs.round_id
    LEFT JOIN catalog c ON c.slug = ae.program_slug
  ),
  module_events AS (
    SELECT jsonb_build_object(
      'id', ps.id, 'type', 'module', 'title', ps.title,
      'programSlug', COALESCE(ae.program_slug, ''),
      'programTitle', COALESCE(c.title, ae.course_name),
      'roundId', ae.round_db_id,
      'dripDelayDays', ps.drip_delay_days,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'module' AND comp.event_id = ps.id),
      'moduleId', ps.id, 'playlistId', ae.audio_playlist_id,
      'dripAnchorDate', CASE WHEN ae.is_self_paced THEN ae.enrolled_at_text ELSE ae.first_session_date_text END,
      'dripOffsetDays', COALESCE(ae.drip_offset_days, 0)
    ) as event
    FROM playlist_supplements ps
    INNER JOIN active_enrollments ae ON ae.audio_playlist_id = ps.playlist_id
    LEFT JOIN catalog c ON c.slug = ae.program_slug
    WHERE ae.audio_playlist_id IS NOT NULL
      AND ps.drip_delay_days > 0
      AND (CASE WHEN ae.is_self_paced THEN ae.enrolled_at_text ELSE ae.first_session_date_text END) IS NOT NULL
  ),
  track_events AS (
    SELECT jsonb_build_object(
      'id', ac.id, 'type', 'track', 'title', ac.title,
      'programSlug', COALESCE(ae.program_slug, ''),
      'programTitle', COALESCE(c.title, ae.course_name),
      'roundId', ae.round_db_id,
      'dripDelayDays', api.drip_delay_days,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'track' AND comp.event_id = ac.id),
      'trackId', ac.id, 'playlistId', ae.audio_playlist_id,
      'dripAnchorDate', CASE WHEN ae.is_self_paced THEN ae.enrolled_at_text ELSE ae.first_session_date_text END,
      'dripOffsetDays', COALESCE(ae.drip_offset_days, 0)
    ) as event
    FROM audio_playlist_items api
    INNER JOIN audio_content ac ON ac.id = api.audio_id
    INNER JOIN active_enrollments ae ON ae.audio_playlist_id = api.playlist_id
    LEFT JOIN catalog c ON c.slug = ae.program_slug
    WHERE ae.audio_playlist_id IS NOT NULL
      AND api.drip_delay_days > 0
      AND (CASE WHEN ae.is_self_paced THEN ae.enrolled_at_text ELSE ae.first_session_date_text END) IS NOT NULL
  ),
  enrollment_events AS (
    SELECT jsonb_build_object(
      'id', ae.enrollment_id, 'type', 'enrollment',
      'programSlug', COALESCE(ae.program_slug, ''),
      'programTitle', COALESCE(c.title, ae.course_name),
      'roundId', ae.round_db_id,
      'enrolledAt', ae.enrolled_at,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'enrollment' AND comp.event_id = ae.enrollment_id)
    ) as event
    FROM active_enrollments ae
    LEFT JOIN catalog c ON c.slug = ae.program_slug
    WHERE ae.enrolled_at::date = v_date
  ),
  round_update_events AS (
    SELECT jsonb_build_object(
      'id', run.id, 'type', 'round_update',
      'programSlug', COALESCE(ae.program_slug, ''),
      'programTitle', COALESCE(c.title, ae.course_name),
      'roundId', ae.round_db_id,
      'createdAt', run.created_at
    ) as event
    FROM round_update_notifications run
    INNER JOIN active_enrollments ae ON ae.round_db_id = run.round_id
    LEFT JOIN catalog c ON c.slug = ae.program_slug
    WHERE run.created_at::date = v_date
      AND NOT EXISTS (
        SELECT 1 FROM round_notification_reads rnr
        WHERE rnr.notification_id = run.id AND rnr.user_id = p_user_id
      )
  ),
  -- NEW: playlist save events (one-time card on the day user activated playlist)
  playlist_save_events AS (
    SELECT jsonb_build_object(
      'id', ps.id,
      'type', 'playlist_save',
      'title', apl.name,
      'playlistId', apl.id,
      'coverImageUrl', apl.cover_image_url,
      'savedAt', ps.saved_at,
      'isCompleted', EXISTS (
        SELECT 1 FROM completions comp 
        WHERE comp.event_type = 'playlist_save' AND comp.event_id = ps.id
      )
    ) as event
    FROM playlist_saves ps
    INNER JOIN audio_playlists apl ON apl.id = ps.playlist_id
    WHERE ps.user_id = p_user_id
      AND ps.saved_at::date = v_date
  ),
  -- NEW: playlist update events (when new audio added to a playlist user has access to)
  playlist_update_events AS (
    SELECT jsonb_build_object(
      'id', api.id,
      'type', 'playlist_update',
      'title', apl.name,
      'audioTitle', ac.title,
      'audioId', ac.id,
      'playlistId', apl.id,
      'coverImageUrl', apl.cover_image_url,
      'createdAt', api.created_at
    ) as event
    FROM audio_playlist_items api
    INNER JOIN audio_content ac ON ac.id = api.audio_id
    INNER JOIN audio_playlists apl ON apl.id = api.playlist_id
    INNER JOIN accessible_playlists ap ON ap.playlist_id = api.playlist_id
    WHERE api.created_at::date = v_date
      AND api.created_at > ap.access_started_at  -- only AFTER user got access
      AND COALESCE(api.drip_delay_days, 0) = 0   -- skip drip-scheduled items (handled by track_events)
      AND NOT EXISTS (
        SELECT 1 FROM playlist_update_notification_reads pur
        WHERE pur.user_id = p_user_id 
          AND pur.playlist_id = api.playlist_id 
          AND pur.audio_id = api.audio_id
      )
  )
  SELECT COALESCE(jsonb_build_object(
    'sessions', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM session_events),
    'modules', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM module_events),
    'tracks', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM track_events),
    'enrollments', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM enrollment_events),
    'round_updates', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM round_update_events),
    'playlist_saves', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM playlist_save_events),
    'playlist_updates', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM playlist_update_events)
  ), '{}'::jsonb) INTO result;

  RETURN result;
END;
$function$;
