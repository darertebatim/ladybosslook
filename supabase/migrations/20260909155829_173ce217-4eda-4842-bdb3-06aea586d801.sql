CREATE TABLE public.webinar_round_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL UNIQUE,
  east_round_number INTEGER NOT NULL DEFAULT 1,
  west_round_number INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.webinar_round_routing TO authenticated;
GRANT ALL ON public.webinar_round_routing TO service_role;

ALTER TABLE public.webinar_round_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webinar round routing"
ON public.webinar_round_routing
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read webinar round routing"
ON public.webinar_round_routing
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_webinar_round_routing_updated_at
BEFORE UPDATE ON public.webinar_round_routing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.webinar_round_routing (program_slug, east_round_number, west_round_number)
VALUES ('igadsfree', 3, 4)
ON CONFLICT (program_slug) DO UPDATE SET
  east_round_number = EXCLUDED.east_round_number,
  west_round_number = EXCLUDED.west_round_number;