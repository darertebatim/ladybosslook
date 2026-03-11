
-- Add recovery count column (0 = no shields used, 1/2/3 = shields used)
ALTER TABLE public.user_streaks 
  ADD COLUMN IF NOT EXISTS streak_recovery_count integer NOT NULL DEFAULT 0;

-- Migrate existing data: if streak_recovery_used was true, set count to 1
UPDATE public.user_streaks 
  SET streak_recovery_count = 1 
  WHERE streak_recovery_used = true;
