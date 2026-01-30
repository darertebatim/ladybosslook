-- Migrate all task templates to the admin_task_bank
INSERT INTO admin_task_bank (
  title, emoji, color, category, description,
  repeat_pattern, sort_order, is_active, is_popular,
  goal_enabled, duration_minutes, reminder_enabled, repeat_days
)
SELECT 
  title,
  emoji,
  color,
  LOWER(category),
  description,
  repeat_pattern,
  display_order,
  is_active,
  is_popular,
  false,
  5,
  false,
  '{}'::integer[]
FROM task_templates
ORDER BY category, display_order;