-- Phase 3: Path step actions — snoozes, swaps, and skip-tomorrow memory
CREATE TABLE public.path_step_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('snooze', 'swap', 'skip_tomorrow')),
  step_kind TEXT NOT NULL,
  step_ref TEXT NOT NULL,
  -- For snooze: when does it expire. For skip_tomorrow: the date being skipped.
  effective_until TIMESTAMPTZ,
  -- For swap: the alternate candidate id selected (format: "kind:ref").
  swap_target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_path_step_actions_user_action
  ON public.path_step_actions(user_id, action, effective_until);

ALTER TABLE public.path_step_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own path step actions"
ON public.path_step_actions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own path step actions"
ON public.path_step_actions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own path step actions"
ON public.path_step_actions FOR DELETE
USING (auth.uid() = user_id);