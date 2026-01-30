-- Migrate Pro Task Templates to admin_task_bank
INSERT INTO admin_task_bank (
  title, emoji, color, category, description,
  duration_minutes, pro_link_type, pro_link_value, 
  linked_playlist_id, is_active, is_popular, 
  sort_order, goal_enabled, repeat_pattern
)
SELECT 
  title,
  CASE 
    WHEN icon = 'BookOpen' THEN '📖'
    WHEN icon = 'Music' THEN '🎵'
    WHEN icon = 'Mic' THEN '🎙️'
    WHEN icon = 'Users' THEN '👥'
    ELSE icon  -- Already an emoji
  END as emoji,
  'amber' as color,
  'pro' as category,
  description,
  duration_minutes,
  pro_link_type,
  pro_link_value,
  linked_playlist_id,
  is_active,
  is_popular,
  32 + ROW_NUMBER() OVER (ORDER BY display_order) as sort_order,
  false as goal_enabled,
  'none' as repeat_pattern
FROM routine_task_templates
ORDER BY display_order;