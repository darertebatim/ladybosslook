-- Insert app_settings entry to force tour banner for all existing users
-- The banner will show once for users who haven't dismissed it after this timestamp
INSERT INTO app_settings (key, value, description)
VALUES (
  'force_tour_banner_until',
  (NOW() + INTERVAL '7 days')::text,
  'Show tour banner to all users until this timestamp (one-time force show for existing users)'
)
ON CONFLICT (key) DO UPDATE SET 
  value = (NOW() + INTERVAL '7 days')::text,
  updated_at = NOW();