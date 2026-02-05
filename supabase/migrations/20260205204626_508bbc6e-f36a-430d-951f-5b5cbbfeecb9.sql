-- Add version tracking to push_subscriptions
ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS app_version text;

-- Index for fast version filtering
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_version 
ON push_subscriptions(app_version);