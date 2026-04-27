ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS platform text;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform_version ON public.push_subscriptions(platform, app_version);