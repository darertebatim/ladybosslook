INSERT INTO program_catalog (
  slug, title, payment_type, price_amount, subscription_interval, subscription_interval_count,
  is_active, requires_subscription, type, description
)
SELECT 
  'simora-plus-annual',
  'Simora Plus Annual',
  'subscription',
  9999,
  'year',
  0,
  true,
  false,
  pc.type,
  'Annual subscription for Simora Plus'
FROM program_catalog pc WHERE pc.slug = 'simora-plus'
ON CONFLICT DO NOTHING;