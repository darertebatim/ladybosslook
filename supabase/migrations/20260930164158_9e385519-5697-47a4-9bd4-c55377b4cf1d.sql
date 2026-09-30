CREATE TABLE public.form_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_key text NOT NULL,
  invited_by uuid,
  channels text[] NOT NULL DEFAULT '{}',
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.form_invites TO authenticated;
GRANT ALL ON public.form_invites TO service_role;
ALTER TABLE public.form_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view form invites" ON public.form_invites FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert form invites" ON public.form_invites FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX form_invites_user_form_idx ON public.form_invites (form_key, user_id, sent_at DESC);