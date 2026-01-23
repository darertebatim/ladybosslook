-- Phase 1: Clean up orphan categories in task_templates
-- Map legacy category values to proper slugs that exist in routine_categories

-- Map 'morning' to 'survival-morning-basics'
UPDATE task_templates SET category = 'survival-morning-basics' WHERE category = 'morning';

-- Map 'evening' to 'nighttime-sleep'
UPDATE task_templates SET category = 'nighttime-sleep' WHERE category = 'evening';

-- Map 'selfcare' to 'mental-health-mindfulness'
UPDATE task_templates SET category = 'mental-health-mindfulness' WHERE category = 'selfcare';

-- Map 'wellness' to 'physical-activity-body-care'
UPDATE task_templates SET category = 'physical-activity-body-care' WHERE category = 'wellness';

-- Convert full names to slug format
UPDATE task_templates SET category = 'gratitude-reflection' WHERE category = 'Gratitude & Reflection';
UPDATE task_templates SET category = 'mental-health-mindfulness' WHERE category = 'Mental Health & Mindfulness';
UPDATE task_templates SET category = 'nighttime-sleep' WHERE category = 'Nighttime & Sleep';
UPDATE task_templates SET category = 'nutrition-healthy-eating' WHERE category = 'Nutrition & Healthy Eating';
UPDATE task_templates SET category = 'physical-activity-body-care' WHERE category = 'Physical Activity & Body Care';
UPDATE task_templates SET category = 'productivity-home-care' WHERE category = 'Productivity & Home Care';
UPDATE task_templates SET category = 'social-connections-community' WHERE category = 'Social Connections & Community';
UPDATE task_templates SET category = 'survival-morning-basics' WHERE category = 'Survival & Morning Basics';

-- Phase 2: Add routine plans for business-work category (currently empty)
-- Get the business-work category ID: 9359a4ee-e767-444b-990e-426d1a2ae8f5

-- Get max display_order
WITH max_order AS (
  SELECT COALESCE(MAX(display_order), 0) as max_val FROM routine_plans
)
INSERT INTO routine_plans (title, subtitle, description, icon, color, estimated_minutes, points, is_pro_routine, is_featured, is_popular, is_active, display_order, category_id)
SELECT 
  title, subtitle, description, icon, color, estimated_minutes, points, is_pro_routine, is_featured, is_popular, is_active, 
  (SELECT max_val FROM max_order) + row_number() OVER (),
  '9359a4ee-e767-444b-990e-426d1a2ae8f5'
FROM (VALUES
  ('Morning CEO Routine', 'Start your day with intention', 'A powerful morning routine designed for entrepreneurs and business leaders. Set your priorities, review your goals, and prepare for a productive day.', 'Briefcase', 'orange', 30, 15, false, true, true, true),
  ('Focus Work Session', 'Deep work for maximum productivity', 'Block out distractions and dive into your most important work. This routine helps you achieve flow state and accomplish meaningful tasks.', 'Target', 'blue', 60, 30, false, false, true, true),
  ('Weekly Business Review', 'Reflect and plan for success', 'End your week with a comprehensive review of your business progress. Celebrate wins, identify challenges, and set goals for the week ahead.', 'TrendingUp', 'green', 45, 20, false, false, false, true),
  ('Networking Power Hour', 'Build meaningful connections', 'Intentional outreach to grow your professional network. Follow up with contacts, engage on social media, and nurture business relationships.', 'Users', 'purple', 60, 25, false, false, false, true),
  ('Strategic Planning Session', 'Design your business future', 'Step back from daily operations to think strategically. Analyze your market, refine your vision, and plan your next big moves.', 'Map', 'yellow', 90, 40, false, false, false, true)
) AS plans(title, subtitle, description, icon, color, estimated_minutes, points, is_pro_routine, is_featured, is_popular, is_active);