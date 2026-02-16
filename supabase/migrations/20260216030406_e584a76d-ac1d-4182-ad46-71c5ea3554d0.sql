
-- Fix: Change UNIQUE constraint from (user_id) to (user_id, program_slug)
-- This allows multiple subscriptions per user (one per program) and matches the onConflict in webhook/client code
ALTER TABLE public.user_subscriptions DROP CONSTRAINT user_subscriptions_user_id_key;
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_program_slug_key UNIQUE (user_id, program_slug);
