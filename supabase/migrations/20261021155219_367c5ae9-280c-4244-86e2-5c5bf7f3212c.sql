CREATE TABLE public.video_watch_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL UNIQUE,
  user_id uuid,
  email text,
  video_key text NOT NULL,
  video_url text,
  video_title text,
  source text NOT NULL DEFAULT 'direct',
  context text,
  page_path text,
  platform text NOT NULL DEFAULT 'web',
  seconds_watched integer NOT NULL DEFAULT 0,
  max_position_seconds integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  percent_watched integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_watch_sessions TO authenticated;
GRANT ALL ON public.video_watch_sessions TO service_role;
ALTER TABLE public.video_watch_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read video watch sessions" ON public.video_watch_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_vws_video_key ON public.video_watch_sessions(video_key, updated_at DESC);
CREATE INDEX idx_vws_user ON public.video_watch_sessions(user_id);

CREATE OR REPLACE FUNCTION public.track_video_watch(
  p_session_key text, p_video_key text, p_video_url text, p_video_title text,
  p_source text, p_context text, p_page_path text, p_platform text, p_email text,
  p_seconds_watched integer, p_position integer, p_duration integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dur integer; v_pct integer; v_uid uuid := auth.uid(); v_email text;
BEGIN
  IF p_session_key IS NULL OR length(p_session_key) > 100 OR p_video_key IS NULL OR length(p_video_key) > 500 THEN RETURN; END IF;
  v_dur := NULLIF(GREATEST(COALESCE(p_duration,0),0),0);
  v_email := lower(trim(NULLIF(left(p_email,255),'')));
  INSERT INTO public.video_watch_sessions AS s (session_key, user_id, email, video_key, video_url, video_title, source, context, page_path, platform, seconds_watched, max_position_seconds, duration_seconds)
  VALUES (p_session_key, v_uid, v_email, p_video_key, left(p_video_url,1000), left(p_video_title,300), left(COALESCE(p_source,'direct'),20), left(p_context,100), left(p_page_path,300), left(COALESCE(p_platform,'web'),20),
    LEAST(GREATEST(COALESCE(p_seconds_watched,0),0), 86400), GREATEST(COALESCE(p_position,0),0), v_dur)
  ON CONFLICT (session_key) DO UPDATE SET
    seconds_watched = GREATEST(s.seconds_watched, LEAST(EXCLUDED.seconds_watched, 86400)),
    max_position_seconds = GREATEST(s.max_position_seconds, EXCLUDED.max_position_seconds),
    duration_seconds = COALESCE(EXCLUDED.duration_seconds, s.duration_seconds),
    user_id = COALESCE(s.user_id, EXCLUDED.user_id),
    email = COALESCE(s.email, EXCLUDED.email),
    updated_at = now()
  WHERE s.video_key = EXCLUDED.video_key;
  UPDATE public.video_watch_sessions SET
    percent_watched = CASE WHEN duration_seconds > 0 THEN LEAST(100, (max_position_seconds * 100 / duration_seconds)) ELSE 0 END,
    completed = duration_seconds > 0 AND max_position_seconds * 100 / duration_seconds >= 90
  WHERE session_key = p_session_key;
END $$;
GRANT EXECUTE ON FUNCTION public.track_video_watch(text,text,text,text,text,text,text,text,text,integer,integer,integer) TO anon, authenticated;