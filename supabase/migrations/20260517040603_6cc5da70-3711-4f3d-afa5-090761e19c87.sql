
ALTER TABLE public.dedications
  ALTER COLUMN recipient_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS recipient_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS recipient_hint TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS dedications_recipient_token_idx
  ON public.dedications(recipient_token) WHERE recipient_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS dedications_claim_lookup
  ON public.dedications(recipient_token) WHERE claimed_at IS NULL;

CREATE OR REPLACE FUNCTION public.generate_dedication_token()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code TEXT; i INT; attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..16 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.dedications WHERE recipient_token = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN RAISE EXCEPTION 'Could not generate unique dedication token'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_dedication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_moment RECORD; v_friend_count INT; v_today_total INT; v_today_tokens INT;
BEGIN
  IF (NEW.recipient_id IS NULL AND NEW.recipient_token IS NULL) OR
     (NEW.recipient_id IS NOT NULL AND NEW.recipient_token IS NOT NULL) THEN
    RAISE EXCEPTION 'Dedication needs exactly one of recipient_id or recipient_token';
  END IF;

  SELECT * INTO v_moment FROM public.user_moments WHERE id = NEW.moment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;
  IF v_moment.user_id <> NEW.sender_id THEN RAISE EXCEPTION 'You can only dedicate your own moments'; END IF;
  IF v_moment.dedicated_at IS NOT NULL THEN RAISE EXCEPTION 'This moment has already been dedicated'; END IF;
  IF v_moment.expires_at < now() THEN RAISE EXCEPTION 'This moment is no longer eligible for dedication'; END IF;

  IF NEW.recipient_id IS NOT NULL THEN
    SELECT count(*) INTO v_friend_count FROM public.friendships
    WHERE status = 'accepted' AND (
      (requester_id = NEW.sender_id AND addressee_id = NEW.recipient_id) OR
      (requester_id = NEW.recipient_id AND addressee_id = NEW.sender_id));
    IF v_friend_count = 0 THEN RAISE EXCEPTION 'You can only dedicate moments to accepted friends'; END IF;
  ELSE
    IF length(NEW.recipient_token) < 16 THEN
      RAISE EXCEPTION 'Invalid dedication token';
    END IF;
  END IF;

  SELECT count(*), count(*) FILTER (WHERE recipient_token IS NOT NULL)
  INTO v_today_total, v_today_tokens
  FROM public.dedications
  WHERE sender_id = NEW.sender_id AND created_at >= date_trunc('day', now());

  IF v_today_total >= 8 THEN RAISE EXCEPTION 'Daily dedication limit reached (8 per day)'; END IF;
  IF NEW.recipient_token IS NOT NULL AND v_today_tokens >= 5 THEN
    RAISE EXCEPTION 'Daily share-link limit reached (5 per day)';
  END IF;

  UPDATE public.user_moments SET dedicated_at = now() WHERE id = NEW.moment_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dedication_by_token(t TEXT)
RETURNS TABLE (
  id UUID, sender_first_name TEXT, sender_avatar_url TEXT, recipient_hint TEXT,
  message TEXT, moment_kind TEXT, moment_title TEXT, moment_emoji TEXT,
  moment_payload JSONB, created_at TIMESTAMPTZ, expires_token_at TIMESTAMPTZ, is_claimed BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    d.id,
    split_part(COALESCE(p.full_name, ''), ' ', 1),
    p.avatar_url,
    d.recipient_hint,
    d.message,
    m.kind, m.title, m.emoji, m.payload,
    d.created_at,
    (d.created_at + interval '30 days'),
    (d.claimed_at IS NOT NULL)
  FROM public.dedications d
  JOIN public.profiles p ON p.id = d.sender_id
  JOIN public.user_moments m ON m.id = d.moment_id
  WHERE d.recipient_token = t
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_dedication_by_token(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_dedication(t TEXT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dedication RECORD; v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_dedication FROM public.dedications WHERE recipient_token = t LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF v_dedication.sender_id = v_uid THEN RAISE EXCEPTION 'self_claim_blocked'; END IF;
  IF v_dedication.claimed_at IS NOT NULL THEN RAISE EXCEPTION 'already_claimed'; END IF;
  IF v_dedication.created_at + interval '30 days' < now() THEN RAISE EXCEPTION 'expired'; END IF;

  UPDATE public.dedications
  SET recipient_id = v_uid, claimed_at = now(), claimed_by_user_id = v_uid
  WHERE id = v_dedication.id;

  INSERT INTO public.friendships (requester_id, addressee_id, status, accepted_at)
  VALUES (v_dedication.sender_id, v_uid, 'accepted', now())
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'dedication_id', v_dedication.id, 'sender_id', v_dedication.sender_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_dedication(TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS public.dedication_claim_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  token TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dedication_claim_attempts_ip_idx
  ON public.dedication_claim_attempts (ip_hash, attempted_at DESC);
ALTER TABLE public.dedication_claim_attempts ENABLE ROW LEVEL SECURITY;
