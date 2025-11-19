-- Drop PWA installations tracking table (no longer needed - native iOS only)
DROP TABLE IF EXISTS pwa_installations;

-- Add comment to push_subscriptions clarifying it's for native tokens only
COMMENT ON TABLE push_subscriptions IS 'Stores native iOS push notification tokens. Web push/PWA is not supported - native app only.';
