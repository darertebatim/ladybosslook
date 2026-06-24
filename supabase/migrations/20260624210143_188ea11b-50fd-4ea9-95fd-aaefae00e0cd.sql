CREATE TABLE public.planner_trophies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, earned_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_trophies TO authenticated;
GRANT ALL ON public.planner_trophies TO service_role;

ALTER TABLE public.planner_trophies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own planner trophies"
  ON public.planner_trophies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planner trophies"
  ON public.planner_trophies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX planner_trophies_user_id_idx ON public.planner_trophies(user_id);