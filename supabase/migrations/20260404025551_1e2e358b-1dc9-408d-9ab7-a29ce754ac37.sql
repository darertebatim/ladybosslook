
-- admin_quizzes table
CREATE TABLE public.admin_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  overview TEXT,
  description TEXT,
  cover_url TEXT,
  theme_color TEXT DEFAULT '#7c3aed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active quizzes"
  ON public.admin_quizzes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quizzes"
  ON public.admin_quizzes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_quizzes_updated_at
  BEFORE UPDATE ON public.admin_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- admin_quiz_questions table
CREATE TABLE public.admin_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.admin_quizzes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single-select',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read quiz questions"
  ON public.admin_quiz_questions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quiz questions"
  ON public.admin_quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- admin_quiz_results table
CREATE TABLE public.admin_quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.admin_quizzes(id) ON DELETE CASCADE,
  result_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  characteristics JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  score_min INTEGER NOT NULL DEFAULT 0,
  score_max INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read quiz results"
  ON public.admin_quiz_results FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage quiz results"
  ON public.admin_quiz_results FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- quiz_submissions table
CREATE TABLE public.quiz_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.admin_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score INTEGER NOT NULL DEFAULT 0,
  result_key TEXT,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON public.quiz_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions"
  ON public.quiz_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions"
  ON public.quiz_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
