-- Drop the existing type check constraint and add a new one with the new types
ALTER TABLE public.feed_channels DROP CONSTRAINT IF EXISTS feed_channels_type_check;

ALTER TABLE public.feed_channels ADD CONSTRAINT feed_channels_type_check 
CHECK (type IN ('general', 'program', 'round', 'all_enrolled', 'all_paid'));