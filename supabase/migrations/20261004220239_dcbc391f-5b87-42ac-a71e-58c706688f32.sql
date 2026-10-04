CREATE TABLE public.one_on_one_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  program_slug text,
  invitee_email text NOT NULL,
  invitee_name text,
  calendly_invitee_uri text NOT NULL UNIQUE,
  calendly_event_uri text,
  event_type_uri text,
  event_name text,
  start_time timestamptz,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'active',
  join_url text,
  cancel_url text,
  reschedule_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.one_on_one_bookings TO authenticated;
GRANT ALL ON public.one_on_one_bookings TO service_role;
ALTER TABLE public.one_on_one_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookings" ON public.one_on_one_bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins view all bookings" ON public.one_on_one_bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_oob_user ON public.one_on_one_bookings(user_id, program_slug);
CREATE INDEX idx_oob_program ON public.one_on_one_bookings(program_slug, start_time);