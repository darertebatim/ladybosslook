ALTER TABLE public.program_auto_enrollment
  ADD COLUMN IF NOT EXISTS east_round_id uuid REFERENCES public.program_rounds(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS west_round_id uuid REFERENCES public.program_rounds(id) ON DELETE SET NULL;