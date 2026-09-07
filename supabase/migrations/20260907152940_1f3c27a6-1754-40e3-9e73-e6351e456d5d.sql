CREATE TABLE public.email_unsubscribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_unsubscribes TO service_role;

ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view unsubscribes"
ON public.email_unsubscribes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.email_unsubscribes TO authenticated;