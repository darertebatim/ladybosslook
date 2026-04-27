CREATE TABLE public.app_review_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  trigger_source text,
  success boolean NOT NULL DEFAULT false,
  forced boolean NOT NULL DEFAULT false,
  app_version text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_review_prompts_platform_created ON public.app_review_prompts (platform, created_at DESC);
CREATE INDEX idx_app_review_prompts_user ON public.app_review_prompts (user_id);

ALTER TABLE public.app_review_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own review prompts"
  ON public.app_review_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all review prompts"
  ON public.app_review_prompts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own review prompts"
  ON public.app_review_prompts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);