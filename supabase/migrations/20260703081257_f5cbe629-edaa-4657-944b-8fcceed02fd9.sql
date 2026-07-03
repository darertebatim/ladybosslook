
-- 1. Tool card questions table (holds AI-generated Qs per user per card)
CREATE TABLE public.aperture_tool_card_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_key TEXT NOT NULL,        -- e.g. tool:quickbooks__accounting, gap:Payments, multi:Payments
  bucket_slug TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_index SMALLINT NOT NULL DEFAULT 0,
  answer_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX aperture_tool_card_questions_user_card_idx
  ON public.aperture_tool_card_questions (user_id, card_key, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_tool_card_questions TO authenticated;
GRANT ALL ON public.aperture_tool_card_questions TO service_role;

ALTER TABLE public.aperture_tool_card_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tool card questions"
  ON public.aperture_tool_card_questions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_tool_card_questions_updated
  BEFORE UPDATE ON public.aperture_tool_card_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Onboarding-done marker on profile (nullable; existing users treated as done if they have tool picks)
ALTER TABLE public.aperture_user_profile
  ADD COLUMN IF NOT EXISTS tool_onboarding_done_at TIMESTAMPTZ;
