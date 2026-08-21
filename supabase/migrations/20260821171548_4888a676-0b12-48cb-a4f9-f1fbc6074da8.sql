CREATE TABLE public.user_quick_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('protein','water')),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_quick_presets TO authenticated;
GRANT ALL ON public.user_quick_presets TO service_role;

ALTER TABLE public.user_quick_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own quick presets"
ON public.user_quick_presets FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_quick_presets_user_tool ON public.user_quick_presets (user_id, tool, sort_order);