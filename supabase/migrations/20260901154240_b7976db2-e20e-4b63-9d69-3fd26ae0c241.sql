CREATE TABLE public.meta_crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL,
  event_name text NOT NULL,
  email text,
  phone text,
  name text,
  ref_id text,
  source text,
  status text NOT NULL DEFAULT 'sent',
  response jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX meta_crm_events_dedupe
  ON public.meta_crm_events (stage, lower(coalesce(email,'')), coalesce(ref_id,''));
CREATE INDEX meta_crm_events_created_idx ON public.meta_crm_events (created_at DESC);

GRANT SELECT ON public.meta_crm_events TO authenticated;
GRANT ALL ON public.meta_crm_events TO service_role;
ALTER TABLE public.meta_crm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view CRM events"
ON public.meta_crm_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.student_admin_notes
  ADD COLUMN IF NOT EXISTS check_attended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_qualified boolean NOT NULL DEFAULT false;