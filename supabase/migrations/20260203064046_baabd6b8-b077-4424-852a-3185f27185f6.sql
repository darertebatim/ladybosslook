-- Add missing categories to routine_categories table
INSERT INTO routine_categories (slug, name, icon, is_active, display_order)
VALUES 
  ('inner-strength', 'Inner Strength', '🔥', true, 5),
  ('hygiene', 'Hygiene', '🧼', true, 6),
  ('pro', 'Pro', '👑', true, 99),
  ('productivity', 'Productivity', '⚡', true, 7),
  ('self-kindness', 'Self-Kindness', '💝', true, 8)
ON CONFLICT (slug) DO NOTHING;