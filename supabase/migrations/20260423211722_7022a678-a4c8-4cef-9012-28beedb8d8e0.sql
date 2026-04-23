-- Add target_instructor_ids column to promo_banners and home_banners
-- so admins can scope these banners to users referred by specific instructors
ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS target_instructor_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

ALTER TABLE public.home_banners
  ADD COLUMN IF NOT EXISTS target_instructor_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

-- Helpful indexes for filtering by instructor scope
CREATE INDEX IF NOT EXISTS idx_promo_banners_target_instructor_ids
  ON public.promo_banners USING GIN (target_instructor_ids);

CREATE INDEX IF NOT EXISTS idx_home_banners_target_instructor_ids
  ON public.home_banners USING GIN (target_instructor_ids);