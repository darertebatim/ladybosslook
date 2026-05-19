ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS friend_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS friend_accepted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS moments_received boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS playlist_gifts boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.regenerate_my_friend_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_new text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  v_new := public.generate_friend_code();
  UPDATE public.profiles SET friend_code = v_new WHERE id = v_uid;
  RETURN v_new;
END;
$$;