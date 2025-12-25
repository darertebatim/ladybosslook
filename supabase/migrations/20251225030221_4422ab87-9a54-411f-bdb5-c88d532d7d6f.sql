-- Fix orders for existing users with ewpluscoaching

-- zammarz@hotmail.com (2 orders)
UPDATE orders SET user_id = '2fb16c12-98f4-41f6-b3e6-47c3a18ac736'
WHERE email = 'zammarz@hotmail.com' AND user_id IS NULL;

-- sara.parvizi4@gmail.com (2 orders)
UPDATE orders SET user_id = 'f0532c4e-d3a1-4d28-a013-39c20c750d20'
WHERE email = 'sara.parvizi4@gmail.com' AND user_id IS NULL;

-- nooshcraft@yahoo.com
UPDATE orders SET user_id = 'fe48b9e2-e10e-4e82-93e4-78313db8a269'
WHERE email = 'nooshcraft@yahoo.com' AND user_id IS NULL;

-- m.ebraahimi@gmail.com
UPDATE orders SET user_id = '2f03e1cc-46bc-4f14-84d8-2de9f01646d6'
WHERE email = 'm.ebraahimi@gmail.com' AND user_id IS NULL;

-- tiamziba@gmail.com
UPDATE orders SET user_id = '510c5b05-dc5b-427a-9a83-8f4045b93716'
WHERE email = 'tiamziba@gmail.com' AND user_id IS NULL;

-- golara.hagh@gmail.com
UPDATE orders SET user_id = '51cd4f5a-9596-42a2-b6f0-5e1bbb313cc9'
WHERE email = 'golara.hagh@gmail.com' AND user_id IS NULL;

-- sagharzohari@yahoo.com
UPDATE orders SET user_id = '9d6ac004-d1cc-425e-99b2-5a60d27060b7'
WHERE email = 'sagharzohari@yahoo.com' AND user_id IS NULL;

-- Create enrollments for EWPLUS coaching users (round_id: c96fe3e3-2417-4cfb-a14a-b05d75aa9bdf)
INSERT INTO course_enrollments (user_id, course_name, program_slug, round_id, status)
VALUES 
  ('2fb16c12-98f4-41f6-b3e6-47c3a18ac736', 'EWPLUS coaching', 'ewpluscoaching', 'c96fe3e3-2417-4cfb-a14a-b05d75aa9bdf', 'active'),
  ('f0532c4e-d3a1-4d28-a013-39c20c750d20', 'EWPLUS coaching', 'ewpluscoaching', 'c96fe3e3-2417-4cfb-a14a-b05d75aa9bdf', 'active'),
  ('fe48b9e2-e10e-4e82-93e4-78313db8a269', 'EWPLUS coaching', 'ewpluscoaching', 'c96fe3e3-2417-4cfb-a14a-b05d75aa9bdf', 'active'),
  ('2f03e1cc-46bc-4f14-84d8-2de9f01646d6', 'EWPLUS coaching', 'ewpluscoaching', 'c96fe3e3-2417-4cfb-a14a-b05d75aa9bdf', 'active')
ON CONFLICT DO NOTHING;