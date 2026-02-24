
-- Create reflections table
CREATE TABLE public.reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reflection_pages table
CREATE TABLE public.reflection_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reflection_id UUID NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  page_order INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'question',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_reflection_responses table
CREATE TABLE public.user_reflection_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reflection_id UUID NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.reflection_pages(id) ON DELETE CASCADE,
  response_text TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reflection_pages_reflection ON public.reflection_pages(reflection_id, page_order);
CREATE INDEX idx_user_reflection_responses_user ON public.user_reflection_responses(user_id, reflection_id);

-- Enable RLS
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reflection_responses ENABLE ROW LEVEL SECURITY;

-- Reflections: readable by all authenticated, writable by admins
CREATE POLICY "Authenticated users can view active reflections"
  ON public.reflections FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reflections"
  ON public.reflections FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Reflection pages: readable by all authenticated, writable by admins
CREATE POLICY "Authenticated users can view reflection pages"
  ON public.reflection_pages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage reflection pages"
  ON public.reflection_pages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- User responses: users can only access their own
CREATE POLICY "Users can view their own responses"
  ON public.user_reflection_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.user_reflection_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.user_reflection_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.user_reflection_responses FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger for reflections
CREATE TRIGGER update_reflections_updated_at
  BEFORE UPDATE ON public.reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
