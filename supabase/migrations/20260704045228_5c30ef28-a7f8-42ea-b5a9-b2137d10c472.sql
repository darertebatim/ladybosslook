ALTER TABLE public.aperture_tool_card_questions
  ADD COLUMN IF NOT EXISTS question_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS open_field BOOLEAN NOT NULL DEFAULT true;