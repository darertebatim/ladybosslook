-- Add subscription configuration fields to program_catalog
ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS subscription_interval text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subscription_interval_count integer DEFAULT NULL;

-- Add check constraint for valid intervals
ALTER TABLE public.program_catalog
ADD CONSTRAINT valid_subscription_interval 
CHECK (subscription_interval IS NULL OR subscription_interval IN ('day', 'week', 'month', 'year'));

-- Add comment for clarity
COMMENT ON COLUMN public.program_catalog.subscription_interval IS 'Billing interval: day, week, month, or year';
COMMENT ON COLUMN public.program_catalog.subscription_interval_count IS 'Number of billing cycles before auto-cancellation (e.g., 9 for 9 months)';