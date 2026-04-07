
CREATE TABLE public.selfcare_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  gap_categories text[] NOT NULL DEFAULT '{}',
  ai_insight text,
  suggested_task_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_selfcare_quiz_results_user_id ON public.selfcare_quiz_results(user_id);

ALTER TABLE public.selfcare_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz results"
  ON public.selfcare_quiz_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
  ON public.selfcare_quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON public.selfcare_quiz_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
