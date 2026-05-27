CREATE TABLE public.selfcare_personality_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  personality TEXT NOT NULL,
  primary_cluster TEXT NOT NULL,
  secondary_cluster TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  secondary_category TEXT NOT NULL,
  readiness_level TEXT NOT NULL,
  task_count INTEGER NOT NULL DEFAULT 3,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_task_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  quiz_version TEXT NOT NULL DEFAULT '2.1',
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.selfcare_personality_results TO authenticated;
GRANT ALL ON public.selfcare_personality_results TO service_role;

ALTER TABLE public.selfcare_personality_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personality results"
ON public.selfcare_personality_results
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personality results"
ON public.selfcare_personality_results
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_selfcare_personality_results_user_taken
  ON public.selfcare_personality_results (user_id, taken_at DESC);