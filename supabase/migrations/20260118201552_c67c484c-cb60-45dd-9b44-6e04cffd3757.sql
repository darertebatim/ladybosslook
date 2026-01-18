-- Seed Sample Routine Plans with Tasks and Educational Sections

-- First, get the category IDs and insert plans
DO $$
DECLARE
  morning_category_id UUID;
  evening_category_id UUID;
  business_category_id UUID;
  plan1_id UUID;
  plan2_id UUID;
  plan3_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO morning_category_id FROM public.routine_categories WHERE slug = 'morning-routines' LIMIT 1;
  SELECT id INTO evening_category_id FROM public.routine_categories WHERE slug = 'evening-wind-down' LIMIT 1;
  SELECT id INTO business_category_id FROM public.routine_categories WHERE slug = 'business-work' LIMIT 1;

  -- Generate plan IDs
  plan1_id := gen_random_uuid();
  plan2_id := gen_random_uuid();
  plan3_id := gen_random_uuid();

  -- Insert Plan 1: Rise & Shine Morning Kickstart
  INSERT INTO public.routine_plans (id, title, subtitle, description, category_id, icon, color, estimated_minutes, points, is_featured, is_popular, display_order)
  VALUES (
    plan1_id,
    'Rise & Shine',
    '10-Minute Morning Kickstart',
    'Start your day with energy and intention. This quick morning routine helps you wake up your body, hydrate, check in with your mood, and set a clear intention for the day ahead.',
    morning_category_id,
    'Sun',
    'yellow',
    10,
    15,
    true,
    true,
    1
  );

  -- Plan 1 Tasks
  INSERT INTO public.routine_plan_tasks (plan_id, title, duration_minutes, icon, task_order) VALUES
  (plan1_id, 'Wake up stretch', 2, 'Dumbbell', 1),
  (plan1_id, 'Hydrate with water', 1, 'Droplet', 2),
  (plan1_id, 'Quick mood check', 1, 'Heart', 3),
  (plan1_id, 'Write gratitude note', 3, 'BookOpen', 4),
  (plan1_id, 'Set daily intention', 3, 'Target', 5);

  -- Plan 1 Educational Sections
  INSERT INTO public.routine_plan_sections (plan_id, title, content, section_order) VALUES
  (plan1_id, 'Why Morning Routines Matter', 'A consistent morning routine sets the tone for your entire day. Studies show that people with morning routines report higher levels of productivity, better mood, and reduced stress throughout the day.', 1),
  (plan1_id, 'Stretch Your Body Awake', 'Gentle stretching in the morning increases blood flow, reduces muscle tension, and signals to your brain that it''s time to wake up. Even just 2 minutes of stretching can make a big difference!', 2),
  (plan1_id, 'The Hydration Boost', 'After 7-8 hours of sleep, your body is naturally dehydrated. Drinking water first thing replenishes fluids, kickstarts your metabolism, and helps you feel more alert.', 3),
  (plan1_id, 'Setting Your Intention', 'Taking a moment to set an intention gives your day direction and purpose. It''s like giving yourself a personal mission statement for the next 24 hours.', 4);

  -- Insert Plan 2: Evening Wind-Down
  INSERT INTO public.routine_plans (id, title, subtitle, description, category_id, icon, color, estimated_minutes, points, is_featured, is_popular, display_order)
  VALUES (
    plan2_id,
    'Evening Wind-Down',
    'Peaceful Night Routine',
    'End your day with calm and gratitude. This evening routine helps you disconnect from screens, reflect on the good, practice deep breathing, and prepare for restful sleep.',
    evening_category_id,
    'Moon',
    'purple',
    15,
    12,
    false,
    true,
    2
  );

  -- Plan 2 Tasks
  INSERT INTO public.routine_plan_tasks (plan_id, title, duration_minutes, icon, task_order) VALUES
  (plan2_id, 'Screen off time', 1, 'Moon', 1),
  (plan2_id, 'Write gratitude list', 5, 'Heart', 2),
  (plan2_id, 'Breathing exercise', 5, 'Wind', 3),
  (plan2_id, 'Prepare for tomorrow', 4, 'Calendar', 4);

  -- Plan 2 Educational Sections
  INSERT INTO public.routine_plan_sections (plan_id, title, content, section_order) VALUES
  (plan2_id, 'The Power of Winding Down', 'A calming evening routine signals to your brain that it''s time to rest. This transition period between the busyness of the day and sleep is crucial for quality rest.', 1),
  (plan2_id, 'Digital Detox', 'Blue light from screens suppresses melatonin production, making it harder to fall asleep. Putting devices away 30-60 minutes before bed can significantly improve your sleep quality.', 2),
  (plan2_id, 'Deep Breathing Technique', 'Try the 4-7-8 technique: Breathe in for 4 seconds, hold for 7 seconds, exhale for 8 seconds. This activates your parasympathetic nervous system and promotes relaxation.', 3),
  (plan2_id, 'Ready for Tomorrow', 'Preparing the night before reduces morning stress and decision fatigue. Lay out clothes, pack your bag, and review your calendar so you can start tomorrow with confidence.', 4);

  -- Insert Plan 3: 5-Minute Focus Boost
  INSERT INTO public.routine_plans (id, title, subtitle, description, category_id, icon, color, estimated_minutes, points, is_featured, is_popular, display_order)
  VALUES (
    plan3_id,
    '5-Minute Focus Boost',
    'Quick Productivity Reset',
    'A quick routine to reset your focus and boost productivity. Perfect for when you need to get back on track during your workday.',
    business_category_id,
    'Briefcase',
    'blue',
    5,
    8,
    false,
    true,
    3
  );

  -- Plan 3 Tasks
  INSERT INTO public.routine_plan_tasks (plan_id, title, duration_minutes, icon, task_order) VALUES
  (plan3_id, 'Clear your desk', 1, 'Sparkles', 1),
  (plan3_id, 'Deep breath cycle', 1, 'Wind', 2),
  (plan3_id, 'Write 3 priorities', 3, 'Target', 3);

  -- Plan 3 Educational Sections
  INSERT INTO public.routine_plan_sections (plan_id, title, content, section_order) VALUES
  (plan3_id, 'Why Focus Resets Work', 'Our brains naturally lose focus after 25-90 minutes of concentrated work. A quick reset helps you regain clarity and productivity.', 1),
  (plan3_id, 'Clear Space, Clear Mind', 'A cluttered workspace creates mental clutter. Taking 60 seconds to organize your immediate area reduces cognitive load and helps you think more clearly.', 2),
  (plan3_id, 'The Power of Three', 'Focusing on just 3 priorities prevents overwhelm and increases the likelihood of completion. Ask yourself: "What 3 things would make today a success?"', 3);

END $$;