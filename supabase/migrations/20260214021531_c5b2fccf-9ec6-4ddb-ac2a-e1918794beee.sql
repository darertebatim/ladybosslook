
-- Add program_slug column to user_subscriptions for per-program access
ALTER TABLE public.user_subscriptions 
  ADD COLUMN IF NOT EXISTS program_slug TEXT;

-- Index for fast program-based lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_program_slug 
  ON public.user_subscriptions(program_slug, status);
