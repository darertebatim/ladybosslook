-- Insert Breathe and Water pro task templates
INSERT INTO routine_task_templates (title, icon, duration_minutes, category, pro_link_type, pro_link_value, display_order, is_active, description)
VALUES 
  ('Breathing Exercise', '🌬️', 5, 'Pro', 'breathe', NULL, 2, true, 'Take a moment to calm your mind with guided breathing exercises.'),
  ('Drink Water', '💧', 1, 'Pro', 'water', NULL, 4, true, 'Stay hydrated throughout your day by tracking your water intake.');