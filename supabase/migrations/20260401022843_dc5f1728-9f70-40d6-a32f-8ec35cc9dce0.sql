
-- Create reading_lessons table
CREATE TABLE public.reading_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image_url text,
  emoji text DEFAULT '📖',
  source_document_id uuid REFERENCES public.admin_documents(id) ON DELETE SET NULL,
  category text DEFAULT 'general',
  is_published boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reading_cards table
CREATE TABLE public.reading_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.reading_lessons(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  title text NOT NULL,
  content text NOT NULL,
  key_point text,
  image_url text,
  bg_color text DEFAULT '#F0E3FF',
  created_at timestamptz DEFAULT now()
);

-- Create reading_progress table
CREATE TABLE public.reading_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.reading_lessons(id) ON DELETE CASCADE,
  last_card_index int DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.reading_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- reading_lessons: authenticated can SELECT published, admins full CRUD
CREATE POLICY "Anyone can view published lessons"
  ON public.reading_lessons FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage lessons"
  ON public.reading_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reading_cards: authenticated can SELECT cards of published lessons, admins full CRUD
CREATE POLICY "Anyone can view cards of published lessons"
  ON public.reading_cards FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.reading_lessons rl
    WHERE rl.id = lesson_id AND rl.is_published = true
  ));

CREATE POLICY "Admins can manage cards"
  ON public.reading_cards FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reading_progress: users manage their own
CREATE POLICY "Users can view own progress"
  ON public.reading_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.reading_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.reading_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for reading_lessons
CREATE TRIGGER update_reading_lessons_updated_at
  BEFORE UPDATE ON public.reading_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
