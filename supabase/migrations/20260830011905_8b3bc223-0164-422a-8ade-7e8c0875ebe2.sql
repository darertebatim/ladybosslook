CREATE TABLE public.email_delivery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id text,
  event_type text NOT NULL,
  recipient text,
  subject text,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_delivery_events_unique_evt
  ON public.email_delivery_events (resend_email_id, event_type)
  WHERE resend_email_id IS NOT NULL;

CREATE INDEX email_delivery_events_recipient_idx ON public.email_delivery_events (lower(recipient));
CREATE INDEX email_delivery_events_subject_idx ON public.email_delivery_events (subject);
CREATE INDEX email_delivery_events_occurred_idx ON public.email_delivery_events (occurred_at DESC);

GRANT SELECT ON public.email_delivery_events TO authenticated;
GRANT ALL ON public.email_delivery_events TO service_role;

ALTER TABLE public.email_delivery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email delivery events"
ON public.email_delivery_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));