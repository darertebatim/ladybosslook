
-- Backfill empty profile fields from orders (most recent order per user wins)
WITH latest_orders AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    name,
    phone,
    billing_city,
    billing_state,
    billing_country
  FROM orders
  WHERE user_id IS NOT NULL
  ORDER BY user_id, created_at DESC
)
UPDATE profiles p
SET
  full_name = CASE WHEN (p.full_name IS NULL OR p.full_name = '') AND lo.name IS NOT NULL AND lo.name != '' THEN lo.name ELSE p.full_name END,
  phone = CASE WHEN (p.phone IS NULL OR p.phone = '') AND lo.phone IS NOT NULL AND lo.phone != '' THEN lo.phone ELSE p.phone END,
  city = CASE WHEN (p.city IS NULL OR p.city = '') AND lo.billing_city IS NOT NULL AND lo.billing_city != '' THEN lo.billing_city ELSE p.city END,
  state = CASE WHEN (p.state IS NULL OR p.state = '') AND lo.billing_state IS NOT NULL AND lo.billing_state != '' THEN lo.billing_state ELSE p.state END,
  country = CASE WHEN (p.country IS NULL OR p.country = '') AND lo.billing_country IS NOT NULL AND lo.billing_country != '' THEN lo.billing_country ELSE p.country END
FROM latest_orders lo
WHERE p.id = lo.user_id
  AND (
    (p.full_name IS NULL OR p.full_name = '') AND lo.name IS NOT NULL AND lo.name != ''
    OR (p.phone IS NULL OR p.phone = '') AND lo.phone IS NOT NULL AND lo.phone != ''
    OR (p.city IS NULL OR p.city = '') AND lo.billing_city IS NOT NULL AND lo.billing_city != ''
    OR (p.state IS NULL OR p.state = '') AND lo.billing_state IS NOT NULL AND lo.billing_state != ''
    OR (p.country IS NULL OR p.country = '') AND lo.billing_country IS NOT NULL AND lo.billing_country != ''
  );
