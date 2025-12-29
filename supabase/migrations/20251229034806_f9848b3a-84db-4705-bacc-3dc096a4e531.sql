-- Add state and country columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text;

-- Backfill profiles with phone, city, state, country from orders
UPDATE profiles p
SET 
  phone = COALESCE(p.phone, (
    SELECT o.phone FROM orders o 
    WHERE o.user_id = p.id AND o.phone IS NOT NULL 
    ORDER BY o.created_at DESC LIMIT 1
  )),
  city = COALESCE(p.city, (
    SELECT o.billing_city FROM orders o 
    WHERE o.user_id = p.id AND o.billing_city IS NOT NULL 
    ORDER BY o.created_at DESC LIMIT 1
  )),
  state = COALESCE(p.state, (
    SELECT o.billing_state FROM orders o 
    WHERE o.user_id = p.id AND o.billing_state IS NOT NULL 
    ORDER BY o.created_at DESC LIMIT 1
  )),
  country = COALESCE(p.country, (
    SELECT o.billing_country FROM orders o 
    WHERE o.user_id = p.id AND o.billing_country IS NOT NULL 
    ORDER BY o.created_at DESC LIMIT 1
  ))
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = p.id);