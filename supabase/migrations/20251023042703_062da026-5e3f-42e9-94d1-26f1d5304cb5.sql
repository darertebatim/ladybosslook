-- Backfill PWA installations from existing push subscriptions
INSERT INTO pwa_installations (user_id, installed_at, user_agent, platform)
SELECT DISTINCT ON (user_id) 
  user_id, 
  created_at as installed_at,
  'Backfilled from push subscription' as user_agent,
  CASE 
    WHEN endpoint LIKE '%apple.com%' THEN 'iOS/macOS'
    WHEN endpoint LIKE '%fcm.googleapis.com%' THEN 'Android/Chrome'
    ELSE 'Unknown'
  END as platform
FROM push_subscriptions
WHERE user_id NOT IN (SELECT user_id FROM pwa_installations)
ORDER BY user_id, created_at ASC
ON CONFLICT (user_id) DO NOTHING;