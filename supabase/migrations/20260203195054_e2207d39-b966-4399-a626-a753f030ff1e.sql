-- Add timezone column to profiles for centralized timezone storage
-- This will be auto-detected from user's device on app open
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Los_Angeles';