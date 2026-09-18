ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone_synced_at timestamptz;
UPDATE public.profiles SET timezone_synced_at = COALESCE(updated_at, created_at) WHERE timezone_synced_at IS NULL;