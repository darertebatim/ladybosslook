-- Add admin role for user bce7b2e1-e60a-45d6-a172-264755a6627b
INSERT INTO user_roles (user_id, role) 
VALUES ('bce7b2e1-e60a-45d6-a172-264755a6627b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;