-- Insert a new "Getting Started" routine for new users
INSERT INTO routines_bank (id, title, subtitle, description, category, color, emoji, is_active, is_popular, sort_order)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Getting Started',
  'A simple routine for new users',
  'Start your wellness journey with these easy, 1-minute habits. Perfect for beginners who want to build consistent daily routines without overwhelm.',
  'general',
  'green',
  '🌱',
  true,
  true,
  0
);

-- Insert sections for the routine
INSERT INTO routines_bank_sections (id, routine_id, title, content, section_order)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Morning Start', 'Begin your day with intention. These quick habits set a positive tone.', 0),
  ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Throughout the Day', 'Small moments of self-care to keep you grounded and refreshed.', 1),
  ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Evening Wind-Down', 'Prepare for restful sleep with these calming rituals.', 2);

-- Insert tasks into the routine (linked to actual tasks from admin_task_bank)
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, duration_minutes, section_id, task_order)
VALUES
  -- Morning Start section
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '9a432bc8-38cb-41d3-9e43-3c04d19d604b', 'Open my curtains first thing in the morning', '🌅', 1, '11111111-1111-1111-1111-111111111111', 0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'd0547a14-5cec-42ec-8f20-73527cfc835e', 'Drink water', '💧', 1, '11111111-1111-1111-1111-111111111111', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f487889c-c05f-4ca0-95fc-60ea17088e5e', 'Take 3 deep breaths', '🌬️', 1, '11111111-1111-1111-1111-111111111111', 2),
  
  -- Throughout the Day section
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '82d3859e-dbb0-4c07-9e30-4fe5b95bdce4', 'Name how I''m feeling right now', '💭', 1, '22222222-2222-2222-2222-222222222222', 0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '63a11f1f-f3b5-4cc2-9981-4938392c0020', 'Take a stretch break', '🤸', 1, '22222222-2222-2222-2222-222222222222', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '973f6116-16e6-4efa-a47f-65fca476fe07', 'Give myself a hug', '🤗', 1, '22222222-2222-2222-2222-222222222222', 2),
  
  -- Evening Wind-Down section
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '97c5c975-a2c6-45d0-b834-630a98f917c4', 'Name one small thing I did well today', '⭐', 1, '33333333-3333-3333-3333-333333333333', 0),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'aab476e5-8faa-44f1-ae45-23e4ee912c82', 'Say one thing I''m grateful for before bed', '🙏', 1, '33333333-3333-3333-3333-333333333333', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '49864811-4daa-420d-8703-0954e44c0167', 'Limit social media before bed', '📵', 1, '33333333-3333-3333-3333-333333333333', 2);