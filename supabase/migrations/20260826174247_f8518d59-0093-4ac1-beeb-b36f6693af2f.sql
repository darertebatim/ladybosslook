ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS morning_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS morning_round_id uuid;