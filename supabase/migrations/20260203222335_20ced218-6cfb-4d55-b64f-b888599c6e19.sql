-- Add presence tracking columns to profiles table
-- These replace streak-based metrics with "depth of return" philosophy

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_active_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date date,
ADD COLUMN IF NOT EXISTS this_month_active_days integer DEFAULT 0;

-- Add comment explaining the philosophy
COMMENT ON COLUMN public.profiles.total_active_days IS 'All-time count of unique days with activity';
COMMENT ON COLUMN public.profiles.return_count IS 'Number of times user returned after 2+ day gap - celebrates returning';
COMMENT ON COLUMN public.profiles.last_active_date IS 'Last date user showed up';
COMMENT ON COLUMN public.profiles.this_month_active_days IS 'Days active in current month (cached for performance)';