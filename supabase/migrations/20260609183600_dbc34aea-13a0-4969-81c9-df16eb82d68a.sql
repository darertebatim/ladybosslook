CREATE OR REPLACE FUNCTION public.get_admin_user_breakdown()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;

  WITH 
    total AS (SELECT count(*)::int AS n FROM profiles),
    tz AS (
      SELECT COALESCE(NULLIF(trim(timezone),''),'— unknown —') AS k, count(*)::int AS c
      FROM profiles GROUP BY 1 ORDER BY c DESC
    ),
    lang AS (
      SELECT COALESCE(NULLIF(trim(preferred_language),''),'— unknown —') AS k, count(*)::int AS c
      FROM profiles GROUP BY 1 ORDER BY c DESC
    ),
    ctry AS (
      SELECT COALESCE(NULLIF(trim(country),''),'— unknown —') AS k, count(*)::int AS c
      FROM profiles GROUP BY 1 ORDER BY c DESC
    ),
    gen AS (
      SELECT COALESCE(NULLIF(trim(gender),''),'— unknown —') AS k, count(*)::int AS c
      FROM profiles GROUP BY 1 ORDER BY c DESC
    ),
    user_platforms AS (
      SELECT user_id, platform FROM push_subscriptions
        WHERE user_id IS NOT NULL AND platform IN ('ios','android')
      UNION
      SELECT user_id, platform FROM app_installations
        WHERE user_id IS NOT NULL AND platform IN ('ios','android')
    ),
    user_platform_summary AS (
      SELECT user_id,
        bool_or(platform='ios') AS has_ios,
        bool_or(platform='android') AS has_android
      FROM user_platforms GROUP BY user_id
    ),
    plat AS (
      SELECT k, count(*)::int AS c FROM (
        SELECT p.id,
          CASE
            WHEN ups.has_ios AND ups.has_android THEN 'iOS + Android'
            WHEN ups.has_ios THEN 'iOS'
            WHEN ups.has_android THEN 'Android'
            ELSE 'Web only (no native install)'
          END AS k
        FROM profiles p
        LEFT JOIN user_platform_summary ups ON ups.user_id = p.id
      ) t GROUP BY k ORDER BY c DESC
    ),
    -- Sign-in provider from auth.users
    prov AS (
      SELECT COALESCE(raw_app_meta_data->>'provider','— unknown —') AS k,
             count(*)::int AS c
      FROM auth.users GROUP BY 1 ORDER BY c DESC
    ),
    -- Onboarding flows: distinct users per flow
    onb AS (
      SELECT flow_id AS k, count(DISTINCT user_id)::int AS c
      FROM onboarding_answers
      WHERE flow_id IS NOT NULL
      GROUP BY 1 ORDER BY c DESC
    ),
    -- Rilo Doors: primary door choice
    rd_primary AS (
      SELECT jsonb_array_elements_text(answer) AS k,
             count(DISTINCT user_id)::int AS c
      FROM onboarding_answers
      WHERE flow_id='rilo-doors' AND step_id='rd-door-primary'
      GROUP BY 1 ORDER BY c DESC
    ),
    rd_secondary AS (
      SELECT jsonb_array_elements_text(answer) AS k,
             count(DISTINCT user_id)::int AS c
      FROM onboarding_answers
      WHERE flow_id='rilo-doors' AND step_id='rd-door-secondary'
      GROUP BY 1 ORDER BY c DESC
    ),
    task_users AS (SELECT user_id, count(*) AS n FROM task_completions WHERE user_id IS NOT NULL GROUP BY 1),
    mood_users AS (SELECT user_id, count(*) AS n FROM emotion_logs WHERE category='mood_checkin' AND user_id IS NOT NULL GROUP BY 1),
    emo_users AS (SELECT user_id, count(*) AS n FROM emotion_logs WHERE COALESCE(category,'') <> 'mood_checkin' AND user_id IS NOT NULL GROUP BY 1),
    audio_users AS (
      SELECT user_id, COALESCE(sum(seconds_listened),0) AS s, count(*) AS plays
      FROM audio_listen_events WHERE user_id IS NOT NULL GROUP BY 1
    ),
    audio_progress_users AS (
      SELECT user_id, COALESCE(sum(current_position_seconds),0) AS s
      FROM audio_progress WHERE user_id IS NOT NULL GROUP BY 1
    ),
    journal_users AS (SELECT user_id, count(*) AS n FROM journal_entries WHERE user_id IS NOT NULL GROUP BY 1),
    refl_users AS (SELECT user_id, count(*) AS n FROM free_form_reflections WHERE user_id IS NOT NULL GROUP BY 1),
    guided_refl_users AS (SELECT user_id, count(*) AS n FROM user_reflection_responses WHERE user_id IS NOT NULL GROUP BY 1),
    breath_users AS (SELECT user_id, count(*) AS n FROM breathing_sessions WHERE user_id IS NOT NULL GROUP BY 1),
    focus_users AS (SELECT user_id, count(*) AS n FROM focus_sessions WHERE user_id IS NOT NULL GROUP BY 1),
    active_days AS (
      SELECT user_id, count(DISTINCT (created_at AT TIME ZONE 'UTC')::date) AS d
      FROM app_return_events WHERE user_id IS NOT NULL GROUP BY 1
    ),
    onb_users AS (SELECT DISTINCT user_id FROM onboarding_answers WHERE user_id IS NOT NULL),
    sub_users AS (SELECT DISTINCT user_id FROM user_subscriptions WHERE user_id IS NOT NULL),
    paid_users AS (SELECT DISTINCT user_id FROM orders WHERE status='completed' AND user_id IS NOT NULL),
    mood_source_rows AS (
      SELECT 
        CASE 
          WHEN 'source:banner' = ANY(COALESCE(contexts,'{}')) THEN 'banner'
          WHEN 'source:path' = ANY(COALESCE(contexts,'{}')) THEN 'path'
          WHEN 'source:dashboard' = ANY(COALESCE(contexts,'{}')) THEN 'path'
          ELSE 'unknown'
        END AS src, user_id
      FROM emotion_logs WHERE category='mood_checkin' AND user_id IS NOT NULL
    ),
    mood_source_counts AS (
      SELECT src, count(*)::int AS logs, count(DISTINCT user_id)::int AS users
      FROM mood_source_rows GROUP BY 1
    )
  SELECT jsonb_build_object(
    'total', (SELECT n FROM total),
    'by_timezone', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM tz), '[]'::jsonb),
    'by_language', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM lang), '[]'::jsonb),
    'by_country',  COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM ctry), '[]'::jsonb),
    'by_gender',   COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM gen), '[]'::jsonb),
    'by_platform', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM plat), '[]'::jsonb),
    'by_provider', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM prov), '[]'::jsonb),
    'by_onboarding_flow', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM onb), '[]'::jsonb),
    'by_rilo_door_primary', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM rd_primary), '[]'::jsonb),
    'by_rilo_door_secondary', COALESCE((SELECT jsonb_agg(jsonb_build_array(k,c)) FROM rd_secondary), '[]'::jsonb),
    'milestones', jsonb_build_object(
      'tasks_10',  (SELECT count(*)::int FROM task_users WHERE n >= 10),
      'mood_5',    (SELECT count(*)::int FROM mood_users WHERE n >= 5),
      'audio_30m', (SELECT count(*)::int FROM audio_users WHERE s >= 1800),
      'audio_30m_legacy', (SELECT count(*)::int FROM audio_progress_users WHERE s >= 1800),
      'audio_5plays', (SELECT count(*)::int FROM audio_users WHERE plays >= 5),
      'journal_3', (SELECT count(*)::int FROM journal_users WHERE n >= 3),
      'reflection_3', (SELECT count(*)::int FROM refl_users WHERE n >= 3),
      'guided_reflection_3', (SELECT count(*)::int FROM guided_refl_users WHERE n >= 3),
      'breath_3', (SELECT count(*)::int FROM breath_users WHERE n >= 3),
      'focus_3', (SELECT count(*)::int FROM focus_users WHERE n >= 3),
      'active_7d', (SELECT count(*)::int FROM active_days WHERE d >= 7)
    ),
    'lifetime', jsonb_build_object(
      'any_audio_event', (SELECT count(*)::int FROM audio_users),
      'any_audio_legacy', (SELECT count(*)::int FROM audio_progress_users),
      'any_breath', (SELECT count(*)::int FROM breath_users),
      'any_focus', (SELECT count(*)::int FROM focus_users),
      'any_mood', (SELECT count(*)::int FROM mood_users),
      'any_emotion', (SELECT count(*)::int FROM emo_users),
      'any_reflection', (SELECT count(*)::int FROM refl_users),
      'any_guided_reflection', (SELECT count(*)::int FROM guided_refl_users),
      'any_journal', (SELECT count(*)::int FROM journal_users),
      'answered_onboarding', (SELECT count(*)::int FROM onb_users),
      'has_subscription', (SELECT count(*)::int FROM sub_users),
      'made_purchase', (SELECT count(*)::int FROM paid_users)
    ),
    'mood_sources', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('source',src,'logs',logs,'users',users) ORDER BY logs DESC) FROM mood_source_counts),
      '[]'::jsonb
    )
  ) INTO result;

  RETURN result;
END;
$$;