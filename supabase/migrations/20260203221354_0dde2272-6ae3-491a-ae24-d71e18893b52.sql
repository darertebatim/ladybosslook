
-- Add missing Pro Action templates
INSERT INTO admin_task_bank (title, emoji, category, color, pro_link_type, pro_link_value, is_active, is_popular, repeat_pattern, sort_order)
VALUES 
  -- Emotion Check-in (missing tool)
  ('Name Your Emotion', '💜', 'pro', 'violet', 'emotion', NULL, true, true, 'daily', 100),
  -- Missing playlists that don't have actions yet
  ('Financial Confidence (Farsi)', '💰', 'pro', 'amber', 'playlist', '32dc71db-61cc-40fe-a7d7-2e82a99f5944', true, false, 'daily', 101),
  ('Toraware (Farsi)', '🌸', 'pro', 'pink', 'playlist', '21b49020-63b9-46b1-ad9a-18a25d5a6240', true, false, 'daily', 102),
  ('Ladyboss Podcast', '🎙️', 'pro', 'purple', 'playlist', '3e7bdfba-48d9-42e8-97da-d7846294bf6a', true, false, 'daily', 103)
ON CONFLICT DO NOTHING;
