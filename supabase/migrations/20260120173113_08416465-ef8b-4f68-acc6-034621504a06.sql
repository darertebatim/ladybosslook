-- Add the 8 task template categories to routine_categories
INSERT INTO public.routine_categories (name, slug, icon, color, display_order, is_active) VALUES
('Survival & Morning Basics', 'survival-morning-basics', 'Sunrise', '#93C5FD', 7, true),
('Mental Health & Mindfulness', 'mental-health-mindfulness', 'Brain', '#C4B5FD', 8, true),
('Gratitude & Reflection', 'gratitude-reflection', 'Sparkles', '#FDE68A', 9, true),
('Nutrition & Healthy Eating', 'nutrition-healthy-eating', 'Apple', '#86EFAC', 10, true),
('Physical Activity & Body Care', 'physical-activity-body-care', 'Dumbbell', '#FDBA74', 11, true),
('Social Connections & Community', 'social-connections-community', 'Users', '#F9A8D4', 12, true),
('Productivity & Home Care', 'productivity-home-care', 'CheckSquare', '#94A3B8', 13, true),
('Nighttime & Sleep', 'nighttime-sleep', 'Moon', '#A5B4FC', 14, true)
ON CONFLICT (slug) DO NOTHING;