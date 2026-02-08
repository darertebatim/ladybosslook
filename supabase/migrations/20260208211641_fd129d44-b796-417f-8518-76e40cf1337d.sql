-- Update empty slugs to use a proper slug format based on name
UPDATE public.feed_channels 
SET slug = 'test-channel'
WHERE id = '170e34b2-03c5-46f5-b15f-b9e554b8434a' AND slug = '';

-- Add a constraint to prevent empty slugs in the future
ALTER TABLE public.feed_channels 
ADD CONSTRAINT feed_channels_slug_not_empty CHECK (slug <> '');