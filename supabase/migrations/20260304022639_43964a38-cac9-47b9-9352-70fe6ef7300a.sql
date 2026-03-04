
CREATE TABLE public.onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  flow_id text NOT NULL,
  step_id text NOT NULL,
  answer jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_onboarding_answers_user_flow ON public.onboarding_answers (user_id, flow_id);

ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own answers"
  ON public.onboarding_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own answers"
  ON public.onboarding_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all answers"
  ON public.onboarding_answers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
