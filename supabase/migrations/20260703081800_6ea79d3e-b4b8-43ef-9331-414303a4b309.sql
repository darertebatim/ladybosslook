
-- Wave B: extend tool card table to support suggestions + regeneration batches
ALTER TABLE public.aperture_tool_card_questions
  ADD COLUMN IF NOT EXISTS row_kind TEXT NOT NULL DEFAULT 'question',
  ADD COLUMN IF NOT EXISTS generation_batch SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS card_kind TEXT,
  ADD COLUMN IF NOT EXISTS card_label TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT;

CREATE INDEX IF NOT EXISTS aperture_tool_card_questions_batch_idx
  ON public.aperture_tool_card_questions (user_id, card_key, generation_batch, row_kind);
