
-- 1. Extend aperture_buckets
ALTER TABLE public.aperture_buckets
  ADD COLUMN IF NOT EXISTS brief text,
  ADD COLUMN IF NOT EXISTS territory text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 2. Extend aperture_bucket_questions
ALTER TABLE public.aperture_bucket_questions
  ADD COLUMN IF NOT EXISTS layer text,
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3. Wipe the 6 placeholder seed buckets (catalog rows where user_id IS NULL).
--    Per-user bucket overrides (if any) are kept. Cascade removes their seed questions.
DELETE FROM public.aperture_bucket_questions WHERE user_id IS NULL;
DELETE FROM public.aperture_buckets WHERE user_id IS NULL;

-- 4. New table: onboarding questions (Quick + Full)
CREATE TABLE IF NOT EXISTS public.aperture_onboarding_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow text NOT NULL CHECK (flow IN ('quick','full')),
  step integer NOT NULL DEFAULT 0,
  question_key text NOT NULL,
  prompt text NOT NULL,
  hint text,
  input_kind text NOT NULL DEFAULT 'textarea'
    CHECK (input_kind IN ('text','textarea','single_choice','multi_choice')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  bucket_slugs text[] NOT NULL DEFAULT ARRAY[]::text[],
  section text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flow, question_key)
);
GRANT SELECT ON public.aperture_onboarding_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_onboarding_questions TO authenticated;
GRANT ALL ON public.aperture_onboarding_questions TO service_role;
ALTER TABLE public.aperture_onboarding_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aperture_onboarding_questions_read" ON public.aperture_onboarding_questions
  FOR SELECT USING (true);
CREATE POLICY "aperture_onboarding_questions_admin_write" ON public.aperture_onboarding_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. New table: industries
CREATE TABLE IF NOT EXISTS public.aperture_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  group_label text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aperture_industries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_industries TO authenticated;
GRANT ALL ON public.aperture_industries TO service_role;
ALTER TABLE public.aperture_industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aperture_industries_read" ON public.aperture_industries
  FOR SELECT USING (true);
CREATE POLICY "aperture_industries_admin_write" ON public.aperture_industries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. New table: per-user profile / onboarding state
CREATE TABLE IF NOT EXISTS public.aperture_user_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quick_onboarded_at timestamptz,
  full_onboarded_at timestamptz,
  industry_slug text,
  business_name text,
  website text,
  instagram text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_user_profile TO authenticated;
GRANT ALL ON public.aperture_user_profile TO service_role;
ALTER TABLE public.aperture_user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aperture_user_profile_owner" ON public.aperture_user_profile
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "aperture_user_profile_admin_read" ON public.aperture_user_profile
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Admin write access on the existing bucket catalog tables.
--    Current policies only allow per-user (user_id = auth.uid()) inserts.
--    Add admin-can-do-anything policies for the shared catalog (user_id IS NULL rows).
CREATE POLICY "aperture_buckets_admin_write" ON public.aperture_buckets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "aperture_bucket_questions_admin_write" ON public.aperture_bucket_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. Touch triggers (reuse existing public.update_updated_at_column if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    -- onboarding_questions
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_aperture_onboarding_questions_updated') THEN
      CREATE TRIGGER tg_aperture_onboarding_questions_updated
        BEFORE UPDATE ON public.aperture_onboarding_questions
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    -- industries
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_aperture_industries_updated') THEN
      CREATE TRIGGER tg_aperture_industries_updated
        BEFORE UPDATE ON public.aperture_industries
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    -- user_profile
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tg_aperture_user_profile_updated') THEN
      CREATE TRIGGER tg_aperture_user_profile_updated
        BEFORE UPDATE ON public.aperture_user_profile
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END$$;
