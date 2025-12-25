
-- Step 1: Update orders to link to user
UPDATE orders 
SET user_id = 'b0825c52-c0dc-4037-bd9a-142f52dac7d5' 
WHERE email = 'razie8254@gmail.com' 
AND program_slug = 'Five-Language' 
AND user_id IS NULL;

-- Step 2: Create enrollment for the user
INSERT INTO course_enrollments (user_id, course_name, program_slug, status)
VALUES (
  'b0825c52-c0dc-4037-bd9a-142f52dac7d5',
  'Five Language of Empowered Woman',
  'Five-Language',
  'active'
)
ON CONFLICT DO NOTHING;

-- Step 3: Create a round for Five-Language program
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
VALUES ('Five-Language', 'Round 1', 1, '2024-12-01', 'active')
ON CONFLICT DO NOTHING;

-- Step 4: Create auto-enrollment rule (will be created after round exists)
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'Five-Language', id FROM program_rounds WHERE program_slug = 'Five-Language' LIMIT 1
ON CONFLICT DO NOTHING;
