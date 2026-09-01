CREATE UNIQUE INDEX IF NOT EXISTS email_delivery_events_email_id_event_type_key
  ON public.email_delivery_events (resend_email_id, event_type);