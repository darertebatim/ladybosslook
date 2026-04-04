
-- Drop old tables
DROP TABLE IF EXISTS public.reading_progress CASCADE;
DROP TABLE IF EXISTS public.reading_cards CASCADE;
DROP TABLE IF EXISTS public.reading_lessons CASCADE;

-- Create reading_content
CREATE TABLE public.reading_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  cover_url text,
  type text NOT NULL DEFAULT 'story' CHECK (type IN ('story', 'lesson')),
  category text NOT NULL DEFAULT 'general',
  author text,
  reading_time_minutes int DEFAULT 5,
  theme_color text DEFAULT '#F0E3FF',
  is_published boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.reading_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published content" ON public.reading_content
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert content" ON public.reading_content
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content" ON public.reading_content
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content" ON public.reading_content
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reading_content_updated_at
  BEFORE UPDATE ON public.reading_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create reading_sections
CREATE TABLE public.reading_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.reading_content(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  heading text,
  body text NOT NULL DEFAULT '',
  quote text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reading_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sections of published content" ON public.reading_sections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reading_content rc WHERE rc.id = content_id AND (rc.is_published = true OR public.has_role(auth.uid(), 'admin')))
  );

CREATE POLICY "Admins can insert sections" ON public.reading_sections
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sections" ON public.reading_sections
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sections" ON public.reading_sections
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create reading_user_progress
CREATE TABLE public.reading_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.reading_content(id) ON DELETE CASCADE,
  last_section_index int DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, content_id)
);

ALTER TABLE public.reading_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.reading_user_progress
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own progress" ON public.reading_user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.reading_user_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reading-covers', 'reading-covers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view reading covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'reading-covers');

CREATE POLICY "Admins can upload reading covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reading-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reading covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'reading-covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reading covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'reading-covers' AND public.has_role(auth.uid(), 'admin'));
