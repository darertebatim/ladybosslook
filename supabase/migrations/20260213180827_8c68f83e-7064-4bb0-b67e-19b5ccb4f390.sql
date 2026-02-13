
-- Add show_on_home and reminder settings to fasting_preferences
ALTER TABLE public.fasting_preferences 
ADD COLUMN IF NOT EXISTS show_on_home boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_zone text DEFAULT NULL;
