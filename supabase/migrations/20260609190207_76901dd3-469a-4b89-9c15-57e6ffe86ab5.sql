
-- 1) program_catalog: 1:1 flags
ALTER TABLE public.program_catalog
  ADD COLUMN IF NOT EXISTS is_one_on_one boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_session_count integer;

-- 2) program_rounds: instructor + owner + flag
ALTER TABLE public.program_rounds
  ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES public.instructors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS is_one_on_one boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_program_rounds_owner_user
  ON public.program_rounds(owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_rounds_instructor
  ON public.program_rounds(instructor_id)
  WHERE instructor_id IS NOT NULL;

-- 3) course_enrollments: how many sessions were paid for
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS sessions_purchased integer;

-- 4) RLS: owner of a 1:1 round can read it
DROP POLICY IF EXISTS "Users can view their own 1:1 round" ON public.program_rounds;
CREATE POLICY "Users can view their own 1:1 round"
  ON public.program_rounds
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- 5) Auto-provision a personal round on enrollment into a 1:1 program
CREATE OR REPLACE FUNCTION public.auto_provision_one_on_one_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat RECORD;
  v_first_name text;
  v_round_id uuid;
BEGIN
  IF NEW.program_slug IS NULL OR NEW.round_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_one_on_one, default_session_count, title
    INTO v_cat
    FROM public.program_catalog
   WHERE slug = NEW.program_slug
   LIMIT 1;

  IF v_cat IS NULL OR v_cat.is_one_on_one IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'Client')
    INTO v_first_name
    FROM public.profiles
   WHERE id = NEW.user_id;

  INSERT INTO public.program_rounds (
    program_slug,
    round_name,
    round_number,
    status,
    max_students,
    is_self_paced,
    is_one_on_one,
    owner_user_id
  ) VALUES (
    NEW.program_slug,
    COALESCE(v_first_name, 'Client') || '''s 1:1 — ' || COALESCE(v_cat.title, NEW.program_slug),
    0,
    'active',
    1,
    false,
    true,
    NEW.user_id
  )
  RETURNING id INTO v_round_id;

  NEW.round_id := v_round_id;
  IF NEW.sessions_purchased IS NULL THEN
    NEW.sessions_purchased := v_cat.default_session_count;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_provision_one_on_one_round ON public.course_enrollments;
CREATE TRIGGER trg_auto_provision_one_on_one_round
  BEFORE INSERT ON public.course_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_one_on_one_round();
