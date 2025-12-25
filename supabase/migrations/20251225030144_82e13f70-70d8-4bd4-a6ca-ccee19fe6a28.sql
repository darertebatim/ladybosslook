-- Create program rounds for programs that don't have any active rounds
-- Then create auto-enrollment rules for all missing programs

-- Create round for private-coaching-session
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'private-coaching-session', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'private-coaching-session');

-- Create round for business-growth-accelerator
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'business-growth-accelerator', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'business-growth-accelerator');

-- Create round for business-startup-accelerator
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'business-startup-accelerator', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'business-startup-accelerator');

-- Create round for iqmoney-income-growth
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'iqmoney-income-growth', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'iqmoney-income-growth');

-- Create round for instagram-growth-course
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'instagram-growth-course', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'instagram-growth-course');

-- Create round for money-literacy-course
INSERT INTO program_rounds (program_slug, round_name, round_number, start_date, status)
SELECT 'money-literacy-course', 'Default', 1, '2024-01-01', 'active'
WHERE NOT EXISTS (SELECT 1 FROM program_rounds WHERE program_slug = 'money-literacy-course');

-- Now create auto-enrollment rules for ALL programs that don't have one

-- ewpluscoaching - use existing round 1US
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'ewpluscoaching', id FROM program_rounds 
WHERE program_slug = 'ewpluscoaching' AND round_name = '1US'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'ewpluscoaching');

-- empowered-woman-coaching - use existing round US1
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'empowered-woman-coaching', id FROM program_rounds 
WHERE program_slug = 'empowered-woman-coaching' AND round_name = 'US1'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'empowered-woman-coaching');

-- connection-literacy-course - use existing round Winter Round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'connection-literacy-course', id FROM program_rounds 
WHERE program_slug = 'connection-literacy-course' AND round_name = 'Winter Round'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'connection-literacy-course');

-- private-coaching-session - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'private-coaching-session', id FROM program_rounds 
WHERE program_slug = 'private-coaching-session'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'private-coaching-session')
LIMIT 1;

-- business-growth-accelerator - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'business-growth-accelerator', id FROM program_rounds 
WHERE program_slug = 'business-growth-accelerator'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'business-growth-accelerator')
LIMIT 1;

-- business-startup-accelerator - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'business-startup-accelerator', id FROM program_rounds 
WHERE program_slug = 'business-startup-accelerator'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'business-startup-accelerator')
LIMIT 1;

-- iqmoney-income-growth - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'iqmoney-income-growth', id FROM program_rounds 
WHERE program_slug = 'iqmoney-income-growth'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'iqmoney-income-growth')
LIMIT 1;

-- instagram-growth-course - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'instagram-growth-course', id FROM program_rounds 
WHERE program_slug = 'instagram-growth-course'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'instagram-growth-course')
LIMIT 1;

-- money-literacy-course - use newly created round
INSERT INTO program_auto_enrollment (program_slug, round_id)
SELECT 'money-literacy-course', id FROM program_rounds 
WHERE program_slug = 'money-literacy-course'
AND NOT EXISTS (SELECT 1 FROM program_auto_enrollment WHERE program_slug = 'money-literacy-course')
LIMIT 1;