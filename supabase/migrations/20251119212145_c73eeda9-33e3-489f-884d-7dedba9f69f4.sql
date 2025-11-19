-- Phase 1: Clean database of old PWA subscriptions and fix token format

-- Delete all old PWA web push subscriptions (endpoints that start with https://)
DELETE FROM push_subscriptions 
WHERE endpoint LIKE 'https://%';

-- Add comments to document that this table is for native iOS only
COMMENT ON TABLE push_subscriptions IS 'Stores native iOS push notification tokens only. Web/PWA push has been removed. Endpoint should be APNs device token, optionally prefixed with "native:".';

COMMENT ON COLUMN push_subscriptions.endpoint IS 'Native iOS APNs device token. Format: APNS_TOKEN or native:APNS_TOKEN';