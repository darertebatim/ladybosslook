CREATE TABLE public.email_campaign_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL UNIQUE,
  preheader text,
  message text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  rtl boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_campaign_contents TO authenticated;
GRANT ALL ON public.email_campaign_contents TO service_role;
ALTER TABLE public.email_campaign_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email contents" ON public.email_campaign_contents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));