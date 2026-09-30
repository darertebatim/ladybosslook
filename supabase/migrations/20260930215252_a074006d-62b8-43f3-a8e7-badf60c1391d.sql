CREATE TABLE public.email_link_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_link_verifications_user ON public.email_link_verifications(user_id);
CREATE INDEX idx_email_link_verifications_email ON public.email_link_verifications(email);

GRANT SELECT ON public.email_link_verifications TO authenticated;
GRANT ALL ON public.email_link_verifications TO service_role;

ALTER TABLE public.email_link_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email verifications"
  ON public.email_link_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role manages email verifications"
  ON public.email_link_verifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);