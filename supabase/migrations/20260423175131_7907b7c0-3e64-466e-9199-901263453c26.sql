-- 1. Instructors table
CREATE TABLE public.instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  photo_url text,
  bio text,
  default_program_slug text,
  default_routine_ids uuid[] NOT NULL DEFAULT '{}',
  plus_trial_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructors_slug ON public.instructors(slug);
CREATE INDEX idx_instructors_active ON public.instructors(is_active);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active instructors viewable by authenticated users"
ON public.instructors FOR SELECT
TO authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage instructors"
ON public.instructors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_instructors_updated_at
BEFORE UPDATE ON public.instructors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Instructor referrals
CREATE TABLE public.instructor_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  instructor_id uuid NOT NULL REFERENCES public.instructors(id) ON DELETE CASCADE,
  attribution_source text NOT NULL DEFAULT 'appsflyer',
  raw_attribution jsonb,
  welcome_shown_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_referrals_user ON public.instructor_referrals(user_id);
CREATE INDEX idx_instructor_referrals_instructor ON public.instructor_referrals(instructor_id);

ALTER TABLE public.instructor_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referral"
ON public.instructor_referrals FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own referral"
ON public.instructor_referrals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users update own referral welcome"
ON public.instructor_referrals FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete referrals"
ON public.instructor_referrals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Profile column for fast lookup
ALTER TABLE public.profiles
ADD COLUMN referred_by_instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by_instructor_id);