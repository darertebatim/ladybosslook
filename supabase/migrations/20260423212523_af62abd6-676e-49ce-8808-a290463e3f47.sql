-- Single source of truth for reusable audience targeting definitions.
-- Mirrors all the fields used by PromoAudienceSelector so any tool that uses
-- it (banners, channels) can apply the same audience with one click.
CREATE TABLE IF NOT EXISTS public.audience_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT NOT NULL DEFAULT '🎯',
  -- targeting payload (matches PromoAudienceSelector props)
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all' | 'enrolled' | 'custom'
  include_programs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  exclude_programs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  include_playlists UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  exclude_playlists UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  include_tools TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  exclude_tools TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_languages TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_timezones TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  include_update_status TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  target_instructor_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  -- bookkeeping
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT audience_presets_name_unique UNIQUE (name)
);

ALTER TABLE public.audience_presets ENABLE ROW LEVEL SECURITY;

-- Admins (and staff with comms-related admin permission) can manage presets
CREATE POLICY "Admins can view audience presets"
ON public.audience_presets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert audience presets"
ON public.audience_presets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update audience presets"
ON public.audience_presets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete audience presets"
ON public.audience_presets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
CREATE TRIGGER trg_audience_presets_updated_at
BEFORE UPDATE ON public.audience_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Optional pointer columns on consumers so we know which preset (if any) was applied.
-- These are just metadata; the actual targeting still lives on each row so existing
-- consumers keep working unchanged.
ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS audience_preset_id UUID REFERENCES public.audience_presets(id) ON DELETE SET NULL;

ALTER TABLE public.home_banners
  ADD COLUMN IF NOT EXISTS audience_preset_id UUID REFERENCES public.audience_presets(id) ON DELETE SET NULL;

ALTER TABLE public.feed_channels
  ADD COLUMN IF NOT EXISTS audience_preset_id UUID REFERENCES public.audience_presets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_promo_banners_audience_preset_id ON public.promo_banners(audience_preset_id);
CREATE INDEX IF NOT EXISTS idx_home_banners_audience_preset_id ON public.home_banners(audience_preset_id);
CREATE INDEX IF NOT EXISTS idx_feed_channels_audience_preset_id ON public.feed_channels(audience_preset_id);