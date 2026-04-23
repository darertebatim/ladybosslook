INSERT INTO user_routines_bank (
  user_id, routine_id, is_active, title, emoji, cover_image_url,
  category, color, schedule_type, is_focus, added_at
)
SELECT 
  '6c5f9bde-058e-4c50-b807-fbe58d962b73'::uuid,
  rb.id, true, rb.title, rb.emoji, rb.cover_image_url,
  rb.category, rb.color, COALESCE(rb.schedule_type, 'daily'),
  COALESCE(rb.is_focus, false), now()
FROM routines_bank rb WHERE rb.id = 'dc57a895-1e86-4a9c-b5a5-e6e165be0959'
ON CONFLICT (user_id, routine_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  title = EXCLUDED.title,
  emoji = EXCLUDED.emoji,
  cover_image_url = EXCLUDED.cover_image_url,
  category = EXCLUDED.category,
  color = EXCLUDED.color,
  schedule_type = EXCLUDED.schedule_type,
  is_focus = EXCLUDED.is_focus;