CREATE TABLE IF NOT EXISTS public.profile_analysis_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  instagram_url text NOT NULL,
  business_field text NOT NULL,
  business_name text,
  product_service text NOT NULL,
  target_audience text NOT NULL,
  offer_includes text NOT NULL,
  conversion_action text NOT NULL,
  question text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profile_analysis_requests TO authenticated;
GRANT ALL ON public.profile_analysis_requests TO service_role;

ALTER TABLE public.profile_analysis_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can submit their own analysis request" ON public.profile_analysis_requests;
CREATE POLICY "Users can submit their own analysis request"
ON public.profile_analysis_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own analysis requests" ON public.profile_analysis_requests;
CREATE POLICY "Users can view their own analysis requests"
ON public.profile_analysis_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update analysis requests" ON public.profile_analysis_requests;
CREATE POLICY "Admins can update analysis requests"
ON public.profile_analysis_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_profile_analysis_requests_user ON public.profile_analysis_requests(user_id, created_at DESC);