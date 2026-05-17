
-- profiles.friend_code
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code TEXT; i INT; attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = code);
    attempts := attempts + 1;
    IF attempts > 20 THEN RAISE EXCEPTION 'Could not generate unique friend code'; END IF;
  END LOOP;
  RETURN code;
END;
$$;

UPDATE public.profiles SET friend_code = public.generate_friend_code() WHERE friend_code IS NULL;

CREATE OR REPLACE FUNCTION public.assign_friend_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.friend_code IS NULL THEN NEW.friend_code := public.generate_friend_code(); END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_assign_friend_code ON public.profiles;
CREATE TRIGGER profiles_assign_friend_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_friend_code();

DROP POLICY IF EXISTS "Authenticated can lookup profile by friend_code" ON public.profiles;
CREATE POLICY "Authenticated can lookup profile by friend_code"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT friendships_status_chk CHECK (status IN ('pending','accepted','declined','blocked')),
  CONSTRAINT friendships_self_chk CHECK (requester_id <> addressee_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_unique
  ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON public.friendships(addressee_id);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- user_moments
CREATE TABLE IF NOT EXISTS public.user_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  dedicated_at TIMESTAMPTZ,
  CONSTRAINT user_moments_kind_chk CHECK (kind IN ('breathe','reflection','audio','routine','mood'))
);
CREATE INDEX IF NOT EXISTS user_moments_user_created_idx ON public.user_moments(user_id, created_at DESC);
ALTER TABLE public.user_moments ENABLE ROW LEVEL SECURITY;

-- dedications
CREATE TABLE IF NOT EXISTS public.dedications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.user_moments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seen_at TIMESTAMPTZ,
  CONSTRAINT dedications_message_len_chk CHECK (message IS NULL OR char_length(message) <= 140),
  CONSTRAINT dedications_self_chk CHECK (sender_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS dedications_recipient_idx ON public.dedications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dedications_sender_idx ON public.dedications(sender_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS dedications_one_per_moment ON public.dedications(moment_id);
ALTER TABLE public.dedications ENABLE ROW LEVEL SECURITY;

-- friend_invite_clicks
CREATE TABLE IF NOT EXISTS public.friend_invite_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_user_id UUID,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS friend_invite_clicks_code_idx ON public.friend_invite_clicks(code);
ALTER TABLE public.friend_invite_clicks ENABLE ROW LEVEL SECURITY;

-- Policies (all tables exist now)
DROP POLICY IF EXISTS "Users see their friendships" ON public.friendships;
CREATE POLICY "Users see their friendships" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
DROP POLICY IF EXISTS "Users send friend requests as themselves" ON public.friendships;
CREATE POLICY "Users send friend requests as themselves" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');
DROP POLICY IF EXISTS "Either party updates" ON public.friendships;
CREATE POLICY "Either party updates" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);
DROP POLICY IF EXISTS "Either party can delete" ON public.friendships;
CREATE POLICY "Either party can delete" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Owner full access to moments" ON public.user_moments;
CREATE POLICY "Owner full access to moments" ON public.user_moments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Recipients can read dedicated moments" ON public.user_moments;
CREATE POLICY "Recipients can read dedicated moments" ON public.user_moments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dedications d WHERE d.moment_id = user_moments.id AND d.recipient_id = auth.uid()));

DROP POLICY IF EXISTS "Sender and recipient can read dedications" ON public.dedications;
CREATE POLICY "Sender and recipient can read dedications" ON public.dedications FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users insert dedications as themselves" ON public.dedications;
CREATE POLICY "Users insert dedications as themselves" ON public.dedications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "Recipient can mark seen" ON public.dedications;
CREATE POLICY "Recipient can mark seen" ON public.dedications FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.friend_invite_clicks;
CREATE POLICY "Anyone can insert clicks" ON public.friend_invite_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read clicks" ON public.friend_invite_clicks;
CREATE POLICY "Admins can read clicks" ON public.friend_invite_clicks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Validation trigger for dedications
CREATE OR REPLACE FUNCTION public.validate_dedication()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_moment RECORD; v_friend_count INT; v_today_count INT;
BEGIN
  SELECT * INTO v_moment FROM public.user_moments WHERE id = NEW.moment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Moment not found'; END IF;
  IF v_moment.user_id <> NEW.sender_id THEN RAISE EXCEPTION 'You can only dedicate your own moments'; END IF;
  IF v_moment.dedicated_at IS NOT NULL THEN RAISE EXCEPTION 'This moment has already been dedicated'; END IF;
  IF v_moment.expires_at < now() THEN RAISE EXCEPTION 'This moment is no longer eligible for dedication'; END IF;

  SELECT count(*) INTO v_friend_count FROM public.friendships
  WHERE status = 'accepted' AND (
    (requester_id = NEW.sender_id AND addressee_id = NEW.recipient_id) OR
    (requester_id = NEW.recipient_id AND addressee_id = NEW.sender_id));
  IF v_friend_count = 0 THEN RAISE EXCEPTION 'You can only dedicate moments to accepted friends'; END IF;

  SELECT count(*) INTO v_today_count FROM public.dedications
  WHERE sender_id = NEW.sender_id AND created_at >= date_trunc('day', now());
  IF v_today_count >= 5 THEN RAISE EXCEPTION 'Daily dedication limit reached (5 per day)'; END IF;

  UPDATE public.user_moments SET dedicated_at = now() WHERE id = NEW.moment_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dedications_validate ON public.dedications;
CREATE TRIGGER dedications_validate
  BEFORE INSERT ON public.dedications
  FOR EACH ROW EXECUTE FUNCTION public.validate_dedication();
