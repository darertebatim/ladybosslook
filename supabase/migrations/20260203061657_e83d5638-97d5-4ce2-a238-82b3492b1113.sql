-- Restore routine categories based on task bank categories
INSERT INTO routine_categories (name, slug, icon, color, display_order, is_active) VALUES
  ('Calm', 'calm', '🧘', 'purple', 1, true),
  ('Connection', 'connection', '💕', 'pink', 2, true),
  ('Easy Win', 'easy-win', '💪', 'green', 3, true),
  ('Gratitude', 'gratitude', '🙏', 'yellow', 4, true),
  ('Self Care', 'selfcare', '💆', 'lavender', 5, true),
  ('Focus', 'focus', '🎯', 'sky', 6, true),
  ('Movement', 'movement', '🚶', 'mint', 7, true),
  ('Sleep', 'sleep', '🌙', 'purple', 8, true),
  ('Nutrition', 'nutrition', '🥗', 'sky', 9, true),
  ('Learning', 'learning', '📚', 'peach', 10, true),
  ('Mindfulness', 'mindfulness', '🧘', 'lavender', 11, true);