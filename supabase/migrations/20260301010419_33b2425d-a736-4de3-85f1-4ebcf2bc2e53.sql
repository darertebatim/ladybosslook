
-- Add High Priority fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'fa';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goals text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source text;

-- Add Medium Priority fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS relationship_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"push": true, "email": true, "sms": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_instagram text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_telegram text;
