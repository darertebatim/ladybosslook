
-- Invite codes
CREATE TABLE public.aperture_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  redeemed_by uuid,
  redeemed_at timestamptz,
  revoked_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_invite_codes TO authenticated;
GRANT ALL ON public.aperture_invite_codes TO service_role;
ALTER TABLE public.aperture_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invite codes" ON public.aperture_invite_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users see their redeemed code" ON public.aperture_invite_codes
  FOR SELECT TO authenticated
  USING (redeemed_by = auth.uid());

-- Access requests
CREATE TABLE public.aperture_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_code_id uuid REFERENCES public.aperture_invite_codes(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_access_requests TO authenticated;
GRANT ALL ON public.aperture_access_requests TO service_role;
ALTER TABLE public.aperture_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage access requests" ON public.aperture_access_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert their own request" ON public.aperture_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users see their own request" ON public.aperture_access_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Approved users
CREATE TABLE public.aperture_approved_users (
  user_id uuid PRIMARY KEY,
  code_id uuid REFERENCES public.aperture_invite_codes(id) ON DELETE SET NULL,
  approved_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_approved_users TO authenticated;
GRANT ALL ON public.aperture_approved_users TO service_role;
ALTER TABLE public.aperture_approved_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage approved users" ON public.aperture_approved_users
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users see their approval" ON public.aperture_approved_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Redeem RPC
CREATE OR REPLACE FUNCTION public.redeem_aperture_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF EXISTS (SELECT 1 FROM public.aperture_approved_users WHERE user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  SELECT * INTO v_code
  FROM public.aperture_invite_codes
  WHERE upper(code) = upper(trim(p_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;
  IF v_code.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'revoked');
  END IF;
  IF v_code.redeemed_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END IF;

  UPDATE public.aperture_invite_codes
    SET redeemed_by = v_uid, redeemed_at = now()
    WHERE id = v_code.id;

  INSERT INTO public.aperture_approved_users (user_id, code_id)
    VALUES (v_uid, v_code.id)
    ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_aperture_invite(text) TO authenticated;
