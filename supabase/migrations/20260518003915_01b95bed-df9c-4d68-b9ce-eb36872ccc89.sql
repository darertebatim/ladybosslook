CREATE OR REPLACE FUNCTION public.validate_dedication()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_moment RECORD; v_friend_count INT; v_today_total INT; v_today_tokens INT;
  v_is_external BOOLEAN;
BEGIN
  IF (NEW.recipient_id IS NULL AND NEW.recipient_token IS NULL) OR
     (NEW.recipient_id IS NOT NULL AND NEW.recipient_token IS NOT NULL) THEN
    RAISE EXCEPTION 'Dedication needs exactly one of recipient_id or recipient_token';
  END IF;

  v_is_external := NEW.recipient_token IS NOT NULL;

  SELECT * INTO v_moment FROM public.user_moments WHERE id = NEW.moment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;
  IF v_moment.user_id <> NEW.sender_id THEN RAISE EXCEPTION 'You can only dedicate your own moments'; END IF;

  -- In-app dedications are one-shot per moment. External (token) gifts can be sent
  -- from any moment, any number of times, and do not consume the moment.
  IF NOT v_is_external AND v_moment.dedicated_at IS NOT NULL THEN
    RAISE EXCEPTION 'This moment has already been dedicated';
  END IF;

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

  -- Only in-app dedications mark the moment as consumed.
  IF NOT v_is_external THEN
    UPDATE public.user_moments SET dedicated_at = now() WHERE id = NEW.moment_id;
  END IF;

  RETURN NEW;
END;
$$;