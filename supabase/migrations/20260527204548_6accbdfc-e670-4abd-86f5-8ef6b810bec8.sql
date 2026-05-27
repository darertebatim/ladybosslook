CREATE TABLE public.my_rilo_path_trophies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  earned_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, earned_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_rilo_path_trophies TO authenticated;
GRANT ALL ON public.my_rilo_path_trophies TO service_role;

ALTER TABLE public.my_rilo_path_trophies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trophies" ON public.my_rilo_path_trophies
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trophies" ON public.my_rilo_path_trophies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own trophies" ON public.my_rilo_path_trophies
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_my_rilo_path_trophies_user ON public.my_rilo_path_trophies (user_id, earned_date DESC);