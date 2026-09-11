ALTER TABLE public.planner_program_completions
  DROP CONSTRAINT IF EXISTS planner_program_completions_event_type_check;

ALTER TABLE public.planner_program_completions
  ADD CONSTRAINT planner_program_completions_event_type_check
  CHECK (event_type = ANY (ARRAY[
    'session'::text,'module'::text,'track'::text,'enrollment'::text,
    'playlist_save'::text,'playlist_update'::text,
    'course_access'::text,'lesson'::text
  ]));

CREATE TABLE IF NOT EXISTS public.learn_course_update_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, lesson_id)
);

GRANT SELECT, INSERT, DELETE ON public.learn_course_update_reads TO authenticated;
GRANT ALL ON public.learn_course_update_reads TO service_role;

ALTER TABLE public.learn_course_update_reads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='learn_course_update_reads' AND policyname='Users manage their own course update reads') THEN
    CREATE POLICY "Users manage their own course update reads"
      ON public.learn_course_update_reads FOR ALL TO authenticated
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

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
  v_tz text;
BEGIN
  v_date := p_date_str::date;
  v_day_start := (v_date - interval '1 day')::timestamptz;
  v_day_end := (v_date + interval '2 days')::timestamptz;

  SELECT COALESCE(NULLIF(timezone, ''), 'America/Los_Angeles')
    INTO v_tz
  FROM profiles
  WHERE id = p_user_id;
  IF v_tz IS NULL THEN
    v_tz := 'America/Los_Angeles';
  END IF;

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
  followed_playlists AS (
    SELECT ps.playlist_id, ps.saved_at as access_started_at
    FROM playlist_saves ps
    WHERE ps.user_id = p_user_id
    UNION
    SELECT ae.audio_playlist_id as playlist_id, ae.enrolled_at as access_started_at
    FROM active_enrollments ae
    WHERE ae.audio_playlist_id IS NOT NULL
  ),
  accessible_courses AS (
    SELECT DISTINCT ON (lc.id)
      lc.id as course_id,
      lc.title as course_title,
      lc.cover_image_url,
      lcr.id as link_id,
      GREATEST(ae.enrolled_at, lcr.created_at) as access_started_at,
      ae.enrolled_at,
      ae.round_db_id,
      ae.program_slug
    FROM learn_course_rounds lcr
    INNER JOIN learn_courses lc ON lc.id = lcr.course_id AND lc.is_published = true
    INNER JOIN active_enrollments ae ON ae.round_db_id = lcr.round_id
    ORDER BY lc.id, GREATEST(ae.enrolled_at, lcr.created_at) ASC
  ),
  round_sessions AS (
    SELECT ps.id, ps.round_id, ps.title, ps.session_date, ps.session_number, ps.meeting_link
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
    WHERE (ae.enrolled_at AT TIME ZONE v_tz)::date = v_date
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
    WHERE (run.created_at AT TIME ZONE v_tz)::date = v_date
      AND NOT EXISTS (
        SELECT 1 FROM round_notification_reads rnr
        WHERE rnr.notification_id = run.id AND rnr.user_id = p_user_id
      )
  ),
  playlist_save_events AS (
    SELECT jsonb_build_object(
      'id', ps.id, 'type', 'playlist_save', 'title', apl.name,
      'playlistId', apl.id, 'coverImageUrl', apl.cover_image_url,
      'savedAt', ps.saved_at,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'playlist_save' AND comp.event_id = ps.id)
    ) as event
    FROM playlist_saves ps
    INNER JOIN audio_playlists apl ON apl.id = ps.playlist_id
    WHERE ps.user_id = p_user_id
      AND (ps.saved_at AT TIME ZONE v_tz)::date = v_date
  ),
  playlist_update_rows AS (
    SELECT apl.id as playlist_id, apl.name as playlist_name, apl.cover_image_url,
      api.audio_id, ac.title as audio_title, api.created_at
    FROM audio_playlist_items api
    INNER JOIN audio_content ac ON ac.id = api.audio_id
    INNER JOIN audio_playlists apl ON apl.id = api.playlist_id
    INNER JOIN followed_playlists fp ON fp.playlist_id = api.playlist_id
    WHERE (api.created_at AT TIME ZONE v_tz)::date = v_date
      AND api.created_at > fp.access_started_at
      AND COALESCE(api.drip_delay_days, 0) = 0
      AND NOT EXISTS (
        SELECT 1 FROM playlist_update_notification_reads pur
        WHERE pur.user_id = p_user_id AND pur.playlist_id = api.playlist_id AND pur.audio_id = api.audio_id
      )
  ),
  playlist_update_events AS (
    SELECT jsonb_build_object(
      'id', 'pu_' || playlist_id::text || '_' || to_char(v_date, 'YYYYMMDD'),
      'type', 'playlist_update', 'title', playlist_name, 'playlistId', playlist_id,
      'coverImageUrl', MAX(cover_image_url), 'audioCount', count(*)::int,
      'audioIds', jsonb_agg(audio_id),
      'firstAudioTitle', (array_agg(audio_title ORDER BY created_at))[1],
      'createdAt', MAX(created_at)
    ) as event
    FROM playlist_update_rows
    GROUP BY playlist_id, playlist_name
  ),
  course_access_events AS (
    SELECT jsonb_build_object(
      'id', ac.link_id, 'type', 'course_access', 'title', ac.course_title,
      'courseId', ac.course_id, 'coverImageUrl', ac.cover_image_url,
      'programSlug', COALESCE(ac.program_slug, ''), 'roundId', ac.round_db_id,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'course_access' AND comp.event_id = ac.link_id)
    ) as event
    FROM accessible_courses ac
    WHERE (ac.access_started_at AT TIME ZONE v_tz)::date = v_date
  ),
  course_update_rows AS (
    SELECT ac.course_id, ac.course_title, ac.cover_image_url,
      ll.id as lesson_id, ll.title as lesson_title, ll.created_at
    FROM learn_lessons ll
    INNER JOIN learn_modules lm ON lm.id = ll.module_id
    INNER JOIN accessible_courses ac ON ac.course_id = lm.course_id
    WHERE ll.is_published = true AND lm.is_published = true
      AND (ll.created_at AT TIME ZONE v_tz)::date = v_date
      AND ll.created_at > ac.access_started_at
      AND ll.drip_days IS NULL AND ll.drip_date IS NULL
      AND lm.drip_days IS NULL AND lm.drip_date IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM learn_course_update_reads lur
        WHERE lur.user_id = p_user_id AND lur.course_id = ac.course_id AND lur.lesson_id = ll.id
      )
  ),
  course_update_events AS (
    SELECT jsonb_build_object(
      'id', 'cu_' || course_id::text || '_' || to_char(v_date, 'YYYYMMDD'),
      'type', 'course_update', 'title', course_title, 'courseId', course_id,
      'coverImageUrl', MAX(cover_image_url), 'lessonCount', count(*)::int,
      'lessonIds', jsonb_agg(lesson_id),
      'firstLessonTitle', (array_agg(lesson_title ORDER BY created_at))[1],
      'createdAt', MAX(created_at)
    ) as event
    FROM course_update_rows
    GROUP BY course_id, course_title
  ),
  lesson_unlock_events AS (
    SELECT jsonb_build_object(
      'id', ll.id, 'type', 'lesson', 'title', ll.title,
      'courseId', ac.course_id, 'courseTitle', ac.course_title,
      'lessonId', ll.id, 'coverImageUrl', ac.cover_image_url,
      'programSlug', COALESCE(ac.program_slug, ''), 'roundId', ac.round_db_id,
      'isCompleted', EXISTS (SELECT 1 FROM completions comp WHERE comp.event_type = 'lesson' AND comp.event_id = ll.id)
    ) as event
    FROM learn_lessons ll
    INNER JOIN learn_modules lm ON lm.id = ll.module_id
    INNER JOIN accessible_courses ac ON ac.course_id = lm.course_id
    WHERE ll.is_published = true AND lm.is_published = true
      AND (
        COALESCE(
          ll.drip_date::date,
          CASE WHEN ll.drip_days IS NOT NULL AND ll.drip_days > 0
               THEN (ac.enrolled_at AT TIME ZONE v_tz)::date + ll.drip_days END
        ) = v_date
        OR COALESCE(
          lm.drip_date::date,
          CASE WHEN lm.drip_days IS NOT NULL AND lm.drip_days > 0
               THEN (ac.enrolled_at AT TIME ZONE v_tz)::date + lm.drip_days END
        ) = v_date
      )
  )
  SELECT COALESCE(jsonb_build_object(
    'sessions', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM session_events),
    'modules', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM module_events),
    'tracks', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM track_events),
    'enrollments', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM enrollment_events),
    'round_updates', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM round_update_events),
    'playlist_saves', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM playlist_save_events),
    'playlist_updates', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM playlist_update_events),
    'course_accesses', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM course_access_events),
    'course_updates', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM course_update_events),
    'lesson_unlocks', (SELECT COALESCE(jsonb_agg(event), '[]'::jsonb) FROM lesson_unlock_events)
  ), '{}'::jsonb) INTO result;

  RETURN result;
END;
$function$;