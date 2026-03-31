
-- Add CEO Wellness category
INSERT INTO public.routine_categories (name, slug, icon, color, display_order, task_display_order, is_active)
VALUES ('CEO Wellness', 'CeoWellness', '👩‍💼', 'lavender', 20, 20, true);

-- Insert 15 CEO Wellness tasks
INSERT INTO public.admin_task_bank (title, emoji, category, color, repeat_pattern, sort_order, is_active, is_popular, goal_enabled) VALUES
('Schedule a ''Do Nothing'' Break (15m)', '⏸️', 'CeoWellness', 'lavender', 'daily', 774, true, false, false),
('Deep Breaths for CEO Clarity', '🌬️', 'CeoWellness', 'lavender', 'daily', 775, true, false, false),
('Stretch My Hardworking Body', '🧘', 'CeoWellness', 'lavender', 'daily', 776, true, false, false),
('Praise Myself for Showing Up Today', '🏆', 'CeoWellness', 'lavender', 'daily', 777, true, false, false),
('Hydrate to Fuel My Ambition', '💧', 'CeoWellness', 'sky', 'daily', 778, true, false, false),
('Declare My Workday ''Complete''', '✅', 'CeoWellness', 'lavender', 'daily', 779, true, false, false),
('Take a Guilt-Free Rest Moment', '😌', 'CeoWellness', 'lavender', 'daily', 780, true, false, false),
('Do a ''Shoulder Drop'' to Release Tension', '💆', 'CeoWellness', 'lavender', 'daily', 781, true, false, false),
('Listen to a Song That Feels Powerful', '🎵', 'CeoWellness', 'lavender', 'daily', 782, true, false, false),
('Acknowledge a Non-Financial ''Win''', '⭐', 'CeoWellness', 'lavender', 'daily', 783, true, false, false),
('Smile at the CEO in the Mirror', '😊', 'CeoWellness', 'pink', 'daily', 784, true, false, false),
('Gentle Neck Roll Break', '🔄', 'CeoWellness', 'lavender', 'daily', 785, true, false, false),
('Step Outside for Fresh Air (5m)', '🌿', 'CeoWellness', 'mint', 'daily', 786, true, false, false),
('Silence Work Notifications for 1 Hour', '🔕', 'CeoWellness', 'lavender', 'daily', 787, true, false, false),
('Choose a Healthy CEO Snack', '🥗', 'CeoWellness', 'mint', 'daily', 788, true, false, false);
