-- Playlist gifts: forever access shared via share-link, max 3 per calendar month per sender
CREATE TABLE public.playlist_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  playlist_id uuid NOT NULL REFERENCES public.audio_playlists(id) ON DELETE CASCADE,
  recipient_token text NOT NULL UNIQUE,
  recipient_id uuid,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_playlist_gifts_sender ON public.playlist_gifts(sender_id, created_at DESC);
CREATE INDEX idx_playlist_gifts_recipient ON public.playlist_gifts(recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX idx_playlist_gifts_token ON public.playlist_gifts(recipient_token);

ALTER TABLE public.playlist_gifts ENABLE ROW LEVEL SECURITY;

-- Sender can see their own outgoing gifts
CREATE POLICY "Senders read own gifts" ON public.playlist_gifts
  FOR SELECT USING (auth.uid() = sender_id);
-- Recipients can see their claimed gifts
CREATE POLICY "Recipients read claimed gifts" ON public.playlist_gifts
  FOR SELECT USING (auth.uid() = recipient_id);

-- Token generator (reuses Crockford-ish alphabet pattern)
CREATE OR REPLACE FUNCTION public.generate_playlist_gift_token()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code TEXT; i INT; attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..16 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.playlist_gifts WHERE recipient_token = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN RAISE EXCEPTION 'Could not generate unique gift token'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

-- Create a gift: validates sender has access to the playlist and is under monthly limit
CREATE OR REPLACE FUNCTION public.create_playlist_gift(p_playlist_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_playlist record;
  v_has_access boolean := false;
  v_has_plus boolean := false;
  v_month_count int;
  v_token text;
  v_gift_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT id, requires_subscription INTO v_playlist
  FROM public.audio_playlists WHERE id = p_playlist_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'playlist_not_found'; END IF;

  -- Monthly limit: 3 per calendar month (regardless of claim status)
  SELECT count(*) INTO v_month_count
  FROM public.playlist_gifts
  WHERE sender_id = v_uid
    AND created_at >= date_trunc('month', now());
  IF v_month_count >= 3 THEN
    RAISE EXCEPTION 'monthly_limit_reached';
  END IF;

  -- Verify sender has access to this playlist
  IF NOT v_playlist.requires_subscription THEN
    v_has_access := true;
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM public.user_subscriptions
      WHERE user_id = v_uid AND program_slug = 'simora-plus'
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > now())
    ) INTO v_has_plus;
    IF v_has_plus THEN
      v_has_access := true;
    ELSIF EXISTS (
      SELECT 1 FROM public.playlist_saves
      WHERE user_id = v_uid AND playlist_id = p_playlist_id
    ) THEN
      v_has_access := true;
    ELSIF EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.program_rounds pr ON pr.id = ce.round_id
      WHERE ce.user_id = v_uid AND ce.status = 'active'
        AND pr.audio_playlist_id = p_playlist_id
    ) THEN
      v_has_access := true;
    END IF;
  END IF;

  IF NOT v_has_access THEN RAISE EXCEPTION 'no_access_to_playlist'; END IF;

  v_token := public.generate_playlist_gift_token();
  INSERT INTO public.playlist_gifts (sender_id, playlist_id, recipient_token)
  VALUES (v_uid, p_playlist_id, v_token)
  RETURNING id INTO v_gift_id;

  RETURN jsonb_build_object('ok', true, 'token', v_token, 'gift_id', v_gift_id);
END;
$$;

-- Public preview by token (no auth required, like dedications)
CREATE OR REPLACE FUNCTION public.get_playlist_gift_by_token(t text)
RETURNS TABLE(
  id uuid,
  sender_first_name text,
  sender_avatar_url text,
  playlist_id uuid,
  playlist_name text,
  playlist_description text,
  playlist_cover_image_url text,
  requires_subscription boolean,
  created_at timestamptz,
  is_claimed boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    g.id,
    split_part(COALESCE(p.full_name, ''), ' ', 1),
    p.avatar_url,
    g.playlist_id,
    apl.name,
    apl.description,
    apl.cover_image_url,
    apl.requires_subscription,
    g.created_at,
    (g.claimed_at IS NOT NULL)
  FROM public.playlist_gifts g
  JOIN public.profiles p ON p.id = g.sender_id
  JOIN public.audio_playlists apl ON apl.id = g.playlist_id
  WHERE g.recipient_token = t
  LIMIT 1;
$$;

-- Claim a gift: inserts a playlist_saves row for forever access
CREATE OR REPLACE FUNCTION public.claim_playlist_gift(t text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gift record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_gift FROM public.playlist_gifts WHERE recipient_token = t LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_gift.sender_id = v_uid THEN RAISE EXCEPTION 'self_claim_blocked'; END IF;
  IF v_gift.claimed_at IS NOT NULL THEN RAISE EXCEPTION 'already_claimed'; END IF;

  UPDATE public.playlist_gifts
  SET recipient_id = v_uid, claimed_at = now()
  WHERE id = v_gift.id;

  -- Grant forever access via playlist_saves (already used by accessible_playlists CTE)
  INSERT INTO public.playlist_saves (user_id, playlist_id)
  VALUES (v_uid, v_gift.playlist_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'playlist_id', v_gift.playlist_id);
END;
$$;