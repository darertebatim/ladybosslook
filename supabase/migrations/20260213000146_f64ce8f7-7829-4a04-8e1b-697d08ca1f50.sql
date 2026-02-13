
CREATE OR REPLACE FUNCTION public.get_home_data(p_user_id uuid, p_date_str text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_profile jsonb;
  v_listening_seconds bigint;
  v_completed_tracks int;
  v_unread_count int;
  v_journal_days_this_month int;
  v_today_completions jsonb;
  v_total_completions bigint;
  v_active_enrollments jsonb;
  v_period_settings jsonb;
  v_streak jsonb;
  v_month_start date;
  v_date date;
BEGIN
  v_date := p_date_str::date;

  -- 1. Profile
  SELECT to_jsonb(p.*) INTO v_profile
  FROM profiles p WHERE p.id = p_user_id;

  -- 2. Audio progress aggregates
  SELECT 
    COALESCE(SUM(current_position_seconds), 0),
    COALESCE(COUNT(*) FILTER (WHERE completed = true), 0)
  INTO v_listening_seconds, v_completed_tracks
  FROM audio_progress WHERE user_id = p_user_id;

  -- 3. Unread posts count
  SELECT COUNT(*) INTO v_unread_count
  FROM feed_posts fp
  WHERE NOT EXISTS (
    SELECT 1 FROM feed_post_reads fpr 
    WHERE fpr.post_id = fp.id AND fpr.user_id = p_user_id
  );

  -- 4. Journal days this month
  v_month_start := date_trunc('month', CURRENT_DATE)::date;
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_journal_days_this_month
  FROM journal_entries
  WHERE user_id = p_user_id AND created_at >= v_month_start;

  -- 5. Today's task completions
  SELECT COALESCE(jsonb_agg(jsonb_build_object('task_id', task_id)), '[]'::jsonb)
  INTO v_today_completions
  FROM task_completions
  WHERE user_id = p_user_id AND completed_date = v_date;

  -- 6. Total completions ever
  SELECT COUNT(*) INTO v_total_completions
  FROM task_completions WHERE user_id = p_user_id;

  -- 7. Active enrollments with rounds
  SELECT COALESCE(jsonb_agg(
    to_jsonb(ce.*) || jsonb_build_object(
      'program_rounds', 
      CASE WHEN pr.id IS NOT NULL THEN to_jsonb(pr.*) ELSE NULL END
    )
    ORDER BY ce.enrolled_at DESC
  ), '[]'::jsonb)
  INTO v_active_enrollments
  FROM course_enrollments ce
  LEFT JOIN program_rounds pr ON pr.id = ce.round_id
  WHERE ce.user_id = p_user_id AND ce.status = 'active';

  -- 8. Period settings
  SELECT to_jsonb(ps.*) INTO v_period_settings
  FROM period_settings ps WHERE ps.user_id = p_user_id;

  -- 9. User streak
  SELECT to_jsonb(us.*) INTO v_streak
  FROM user_streaks us WHERE us.user_id = p_user_id;

  -- Build result
  result := jsonb_build_object(
    'profile', v_profile,
    'listening_minutes', (v_listening_seconds / 60),
    'completed_tracks', v_completed_tracks,
    'unread_posts', v_unread_count,
    'days_this_month', v_journal_days_this_month,
    'today_completions', v_today_completions,
    'total_completions', v_total_completions,
    'active_enrollments', v_active_enrollments,
    'period_settings', v_period_settings,
    'streak', v_streak
  );

  RETURN result;
END;
$function$;
