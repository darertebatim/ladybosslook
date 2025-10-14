-- Add Courageous Character Course purchase for alilotfijami@gmail.com
INSERT INTO orders (user_id, email, name, product_name, amount, currency, status, stripe_session_id)
SELECT 
  p.id,
  p.email,
  p.full_name,
  'Courageous Character Course',
  9700,
  'usd',
  'paid',
  'manual_admin_' || gen_random_uuid()::text
FROM profiles p
WHERE p.email = 'alilotfijami@gmail.com'
ON CONFLICT DO NOTHING;