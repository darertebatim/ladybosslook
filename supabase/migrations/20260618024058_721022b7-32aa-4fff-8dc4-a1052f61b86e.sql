ALTER TABLE public.aperture_actions ADD COLUMN IF NOT EXISTS industry_group_slug TEXT;
CREATE INDEX IF NOT EXISTS aperture_actions_industry_idx ON public.aperture_actions(industry_group_slug);