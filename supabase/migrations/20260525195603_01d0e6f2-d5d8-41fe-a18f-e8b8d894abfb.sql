-- Track per-day path-step dismissals so "Skip" hides a step for the rest of today.
-- Keys are intentionally synthetic strings (path engine builds them) so any
-- step kind can be dismissed without needing a strict FK.
CREATE TABLE public.path_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_date DATE NOT NULL,
  step_kind TEXT NOT NULL,
  step_ref TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, dismissed_date, step_kind, step_ref)
);

CREATE INDEX idx_path_dismissals_user_date
  ON public.path_dismissals (user_id, dismissed_date);

ALTER TABLE public.path_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own path dismissals"
  ON public.path_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own path dismissals"
  ON public.path_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path dismissals"
  ON public.path_dismissals FOR DELETE
  USING (auth.uid() = user_id);