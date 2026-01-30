-- Delete generic Breathing Exercise template (replaced with specific ones)
DELETE FROM routine_task_templates WHERE title = 'Breathing Exercise' AND pro_link_type = 'breathe';

-- Insert one pro task template per breathing exercise
INSERT INTO routine_task_templates (title, icon, duration_minutes, category, pro_link_type, pro_link_value, display_order, is_active, description)
VALUES 
  ('Calm Breathing', '🏝️', 5, 'Pro', 'breathe', 'd5f63835-1fe7-4ae3-b4e2-543b64855a6b', 2, true, 'Relax and find your inner peace with calm breathing.'),
  ('Simora Breathing', '🚀', 5, 'Pro', 'breathe', 'd701393b-490f-42b0-8502-26e9313fdf1a', 3, true, 'Boost focus and energy with Simora breathing technique.'),
  ('Box Breathing', '📦', 5, 'Pro', 'breathe', 'c6d8e336-9f07-4a69-a39e-c50c75fbd7d6', 4, true, 'Center yourself with the classic box breathing method.'),
  ('Energy Boost', '⚡', 5, 'Pro', 'breathe', 'f2df5682-712b-464c-8249-6a937c92f842', 5, true, 'Energize your body and mind with invigorating breaths.');