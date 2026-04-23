-- Add default_channel_ids to instructors so they can auto-link followers to one or more chat channels
ALTER TABLE public.instructors
  ADD COLUMN IF NOT EXISTS default_channel_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

-- Add a new audience target type for instructor-scoped channels
-- (channels with target_type='instructor' and target_instructor_ids set are only visible
--  to users referred by one of those instructors)
ALTER TABLE public.feed_channels
  ADD COLUMN IF NOT EXISTS target_instructor_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

-- Helper index for the referral lookups we'll do during channel filtering
CREATE INDEX IF NOT EXISTS idx_instructor_referrals_user ON public.instructor_referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_instructor_referrals_instructor ON public.instructor_referrals(instructor_id);