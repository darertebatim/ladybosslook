-- Drop FK constraint so user-created routines don't need a routines_bank entry
ALTER TABLE public.user_routines_bank DROP CONSTRAINT IF EXISTS user_routines_bank_routine_id_fkey;

-- Set default for routine_id so user-created routines auto-generate a linking UUID
ALTER TABLE public.user_routines_bank ALTER COLUMN routine_id SET DEFAULT gen_random_uuid();

-- Add flag to distinguish user-created routines from bank-adopted ones
ALTER TABLE public.user_routines_bank ADD COLUMN is_user_created boolean NOT NULL DEFAULT false;