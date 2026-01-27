-- Temporarily hide all Pro Routines from the app
-- This prevents the buggy Pro Routines section from showing on old iOS versions
-- Can be reverted after the next app store update

UPDATE routine_plans 
SET is_active = false 
WHERE is_pro_routine = true;