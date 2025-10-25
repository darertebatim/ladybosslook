-- Create enum for audio categories
CREATE TYPE public.audio_category AS ENUM ('audiobook', 'course_supplement', 'podcast');

-- Create audio_content table
CREATE TABLE public.audio_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_size_mb NUMERIC(10,2),
  cover_image_url TEXT,
  category audio_category NOT NULL,
  program_slug TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio_progress table
CREATE TABLE public.audio_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES public.audio_content(id) ON DELETE CASCADE,
  current_position_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, audio_id)
);

-- Create audio_playlists table
CREATE TABLE public.audio_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  program_slug TEXT,
  is_free BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio_playlist_items table
CREATE TABLE public.audio_playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.audio_playlists(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES public.audio_content(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, audio_id)
);

-- Enable RLS
ALTER TABLE public.audio_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_playlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audio_content
CREATE POLICY "Anyone can view free audio content"
  ON public.audio_content FOR SELECT
  USING (is_free = true);

CREATE POLICY "Enrolled users can view course audio"
  ON public.audio_content FOR SELECT
  USING (
    program_slug IS NULL OR 
    is_free = true OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE user_id = auth.uid() 
      AND program_slug = audio_content.program_slug
      AND status = 'active'
    ) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage audio content"
  ON public.audio_content FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for audio_progress
CREATE POLICY "Users can view their own progress"
  ON public.audio_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.audio_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.audio_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
  ON public.audio_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for audio_playlists
CREATE POLICY "Anyone can view free playlists"
  ON public.audio_playlists FOR SELECT
  USING (is_free = true);

CREATE POLICY "Enrolled users can view course playlists"
  ON public.audio_playlists FOR SELECT
  USING (
    program_slug IS NULL OR 
    is_free = true OR
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE user_id = auth.uid() 
      AND program_slug = audio_playlists.program_slug
      AND status = 'active'
    ) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage playlists"
  ON public.audio_playlists FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for audio_playlist_items
CREATE POLICY "Users can view playlist items they have access to"
  ON public.audio_playlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.audio_playlists
      WHERE id = audio_playlist_items.playlist_id
      AND (
        is_free = true OR
        EXISTS (
          SELECT 1 FROM public.course_enrollments
          WHERE user_id = auth.uid() 
          AND program_slug = audio_playlists.program_slug
          AND status = 'active'
        ) OR
        has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Admins can manage playlist items"
  ON public.audio_playlist_items FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_audio_content_updated_at
  BEFORE UPDATE ON public.audio_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

CREATE TRIGGER update_audio_progress_updated_at
  BEFORE UPDATE ON public.audio_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio_files', 'audio_files', false);

-- Storage RLS policies
CREATE POLICY "Admins can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio_files' AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update audio files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'audio_files' AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete audio files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio_files' AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can download audio files they have access to"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio_files' AND (
      -- Free audio accessible to all
      EXISTS (
        SELECT 1 FROM public.audio_content
        WHERE file_url LIKE '%' || name || '%'
        AND is_free = true
      ) OR
      -- Course audio accessible to enrolled users
      EXISTS (
        SELECT 1 FROM public.audio_content ac
        LEFT JOIN public.course_enrollments ce ON ce.program_slug = ac.program_slug
        WHERE ac.file_url LIKE '%' || name || '%'
        AND ce.user_id = auth.uid()
        AND ce.status = 'active'
      ) OR
      -- Admins can access all
      has_role(auth.uid(), 'admin')
    )
  );