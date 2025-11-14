-- Create test reviewer account
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'reviewer2@ladybosslook.com',
    crypt('ReviewAccess2025!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO new_user_id;

  -- Profile will be auto-created by trigger handle_new_user()
  -- Wallet will be auto-created by trigger create_user_wallet()
  
  RAISE NOTICE 'Created test account: reviewer2@ladybosslook.com with user_id: %', new_user_id;
END $$;