CREATE TABLE public.learn_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_courses TO authenticated;
GRANT ALL ON public.learn_courses TO service_role;
ALTER TABLE public.learn_courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.learn_course_rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.learn_courses(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.program_rounds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, round_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_course_rounds TO authenticated;
GRANT ALL ON public.learn_course_rounds TO service_role;
ALTER TABLE public.learn_course_rounds ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.learn_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES public.learn_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_modules TO authenticated;
GRANT ALL ON public.learn_modules TO service_role;
ALTER TABLE public.learn_modules ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.learn_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.learn_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_type text NOT NULL DEFAULT 'video',
  video_id uuid REFERENCES public.video_content(id) ON DELETE SET NULL,
  audio_id uuid REFERENCES public.audio_content(id) ON DELETE SET NULL,
  reading_id uuid REFERENCES public.reading_content(id) ON DELETE SET NULL,
  pdf_url text,
  duration_seconds integer,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_lessons TO authenticated;
GRANT ALL ON public.learn_lessons TO service_role;
ALTER TABLE public.learn_lessons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.learn_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.learn_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learn_lesson_progress TO authenticated;
GRANT ALL ON public.learn_lesson_progress TO service_role;
ALTER TABLE public.learn_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Helper: is the user enrolled in a round attached to this course?
CREATE OR REPLACE FUNCTION public.can_access_learn_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.learn_course_rounds lcr
    JOIN public.course_enrollments ce ON ce.round_id = lcr.round_id
    WHERE lcr.course_id = _course_id
      AND ce.user_id = _user_id
  )
$$;

-- lesson_type validation trigger (instead of CHECK for flexibility)
CREATE OR REPLACE FUNCTION public.validate_learn_lesson_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.lesson_type NOT IN ('video','audio','document','pdf') THEN
    RAISE EXCEPTION 'invalid lesson_type: %', NEW.lesson_type;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_learn_lesson_type BEFORE INSERT OR UPDATE ON public.learn_lessons
FOR EACH ROW EXECUTE FUNCTION public.validate_learn_lesson_type();

-- updated_at triggers
CREATE TRIGGER update_learn_courses_updated_at BEFORE UPDATE ON public.learn_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learn_modules_updated_at BEFORE UPDATE ON public.learn_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_learn_lessons_updated_at BEFORE UPDATE ON public.learn_lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: courses
CREATE POLICY "Admins can manage learn courses"
ON public.learn_courses FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view published courses"
ON public.learn_courses FOR SELECT TO authenticated
USING (is_published AND public.can_access_learn_course(auth.uid(), id));

-- RLS: course-round links
CREATE POLICY "Admins can manage course round links"
ON public.learn_course_rounds FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view links for their courses"
ON public.learn_course_rounds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments ce
    WHERE ce.round_id = learn_course_rounds.round_id
      AND ce.user_id = auth.uid()
  )
);

-- RLS: modules
CREATE POLICY "Admins can manage learn modules"
ON public.learn_modules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view modules"
ON public.learn_modules FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.learn_courses c
    WHERE c.id = learn_modules.course_id
      AND c.is_published
      AND public.can_access_learn_course(auth.uid(), c.id)
  )
);

-- RLS: lessons
CREATE POLICY "Admins can manage learn lessons"
ON public.learn_lessons FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled students can view lessons"
ON public.learn_lessons FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.learn_modules m
    JOIN public.learn_courses c ON c.id = m.course_id
    WHERE m.id = learn_lessons.module_id
      AND c.is_published
      AND public.can_access_learn_course(auth.uid(), c.id)
  )
);

-- RLS: progress (own rows only)
CREATE POLICY "Users can view own lesson progress"
ON public.learn_lesson_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
ON public.learn_lesson_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lesson progress"
ON public.learn_lesson_progress FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_learn_course_rounds_round ON public.learn_course_rounds(round_id);
CREATE INDEX idx_learn_modules_course ON public.learn_modules(course_id, sort_order);
CREATE INDEX idx_learn_lessons_module ON public.learn_lessons(module_id, sort_order);
CREATE INDEX idx_learn_lesson_progress_user ON public.learn_lesson_progress(user_id);