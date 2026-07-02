ALTER TABLE public.aperture_messages
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS usd_cost numeric(12,6) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.aperture_ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fn text NOT NULL,
  model text NOT NULL,
  prompt_tokens int NOT NULL DEFAULT 0,
  completion_tokens int NOT NULL DEFAULT 0,
  usd_cost numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.aperture_ai_usage TO authenticated;
GRANT ALL ON public.aperture_ai_usage TO service_role;

ALTER TABLE public.aperture_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aperture_ai_usage_admin_read" ON public.aperture_ai_usage
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "aperture_ai_usage_owner_read" ON public.aperture_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS aperture_ai_usage_user_id_idx ON public.aperture_ai_usage(user_id);
CREATE INDEX IF NOT EXISTS aperture_ai_usage_created_at_idx ON public.aperture_ai_usage(created_at DESC);