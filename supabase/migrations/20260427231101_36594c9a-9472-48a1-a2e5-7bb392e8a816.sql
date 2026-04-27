-- 1. Seed latest_android_version if missing
INSERT INTO public.app_settings (key, value)
VALUES ('latest_android_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- 2. Backfill push_subscriptions.platform from app_installations (most recent)
WITH latest_install AS (
  SELECT DISTINCT ON (user_id) user_id, platform
  FROM public.app_installations
  WHERE platform IN ('ios','android')
  ORDER BY user_id, last_seen_at DESC NULLS LAST
)
UPDATE public.push_subscriptions ps
SET platform = li.platform
FROM latest_install li
WHERE ps.user_id = li.user_id
  AND ps.platform IS NULL;

-- 3. Default any remaining NULLs to 'ios' (legacy native subs, App Store only)
UPDATE public.push_subscriptions
SET platform = 'ios'
WHERE platform IS NULL
  AND endpoint LIKE 'native:%';