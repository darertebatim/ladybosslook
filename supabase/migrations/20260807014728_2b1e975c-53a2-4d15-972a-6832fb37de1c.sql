ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS next_session_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_session_round_id uuid;