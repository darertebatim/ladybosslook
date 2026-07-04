ALTER TABLE public.aperture_tool_card_questions
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS open_field boolean NOT NULL DEFAULT true;