-- Foundational event log for Aperture: append-only typed events
CREATE TABLE public.aperture_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  conversation_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aperture_events_user_created
  ON public.aperture_events (user_id, created_at DESC);
CREATE INDEX idx_aperture_events_type_created
  ON public.aperture_events (event_type, created_at DESC);
CREATE INDEX idx_aperture_events_conversation
  ON public.aperture_events (conversation_id, created_at)
  WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_aperture_events_payload_gin
  ON public.aperture_events USING gin (payload);

GRANT SELECT, INSERT ON public.aperture_events TO authenticated;
GRANT ALL ON public.aperture_events TO service_role;

ALTER TABLE public.aperture_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users insert own events"
  ON public.aperture_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own events
CREATE POLICY "Users read own events"
  ON public.aperture_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read everything for research/debugging
CREATE POLICY "Admins read all events"
  ON public.aperture_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Helper: log an event with caller-scoped user
CREATE OR REPLACE FUNCTION public.log_aperture_event(
  p_event_type text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.aperture_events (user_id, event_type, payload, conversation_id)
  VALUES (auth.uid(), p_event_type, COALESCE(p_payload, '{}'::jsonb), p_conversation_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_aperture_event(text, jsonb, uuid) TO authenticated, service_role;