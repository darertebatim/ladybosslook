-- 1. Packages table
CREATE TABLE public.instructor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_image_url text,
  default_program_slug text,
  default_routine_ids uuid[] NOT NULL DEFAULT '{}',
  default_playlist_ids uuid[] NOT NULL DEFAULT '{}',
  default_channel_ids uuid[] NOT NULL DEFAULT '{}',
  plus_trial_days integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_packages_instructor_id ON public.instructor_packages(instructor_id);
CREATE INDEX idx_instructor_packages_slug ON public.instructor_packages(slug);
CREATE INDEX idx_instructor_packages_active ON public.instructor_packages(is_active) WHERE is_active = true;

-- Updated_at trigger
CREATE TRIGGER trg_instructor_packages_updated_at
BEFORE UPDATE ON public.instructor_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.instructor_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
ON public.instructor_packages FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert packages"
ON public.instructor_packages FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update packages"
ON public.instructor_packages FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete packages"
ON public.instructor_packages FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Track which package a referral came from
ALTER TABLE public.instructor_referrals
  ADD COLUMN package_id uuid REFERENCES public.instructor_packages(id) ON DELETE SET NULL;

CREATE INDEX idx_instructor_referrals_package_id ON public.instructor_referrals(package_id);

-- 3. Drop the old unique constraint on (user_id, instructor_id) so a user can
-- accept multiple packages from the same instructor over time.
-- Replace with unique on (user_id, instructor_id, package_id) where package_id is set,
-- and (user_id, instructor_id) where it's null (legacy single-bundle path).
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.instructor_referrals'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 2;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.instructor_referrals DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

-- Partial unique indexes for idempotency
CREATE UNIQUE INDEX idx_referrals_unique_with_package
  ON public.instructor_referrals(user_id, instructor_id, package_id)
  WHERE package_id IS NOT NULL;

CREATE UNIQUE INDEX idx_referrals_unique_legacy
  ON public.instructor_referrals(user_id, instructor_id)
  WHERE package_id IS NULL;