INSERT INTO app_settings (key, value, description)
VALUES ('latest_ios_version', '1.1.07', 'Manual override for iOS version check')
ON CONFLICT (key) DO UPDATE SET value = '1.1.07', updated_at = now();