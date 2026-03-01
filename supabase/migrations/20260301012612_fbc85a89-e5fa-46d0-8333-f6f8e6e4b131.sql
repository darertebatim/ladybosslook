-- Add gender column to profiles
ALTER TABLE public.profiles ADD COLUMN gender text DEFAULT NULL;