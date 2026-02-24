
-- Video Content table (mirrors audio_content)
CREATE TABLE public.video_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  duration_seconds integer NOT NULL DEFAULT 0,
  file_size_mb numeric,
  video_type text NOT NULL DEFAULT 'direct',
  is_vertical boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT true,
  program_slug text,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Video Playlists table (mirrors audio_playlists)
CREATE TABLE public.video_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image_url text,
  category text DEFAULT 'tutorial',
  program_slug text,
  is_free boolean NOT NULL DEFAULT true,
  requires_subscription boolean NOT NULL DEFAULT false,
  available_on_mobile boolean NOT NULL DEFAULT true,
  is_hidden boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'american',
  sort_order integer NOT NULL DEFAULT 0,
  display_mode text NOT NULL DEFAULT 'tracks',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Video Playlist Items junction table (mirrors audio_playlist_items)
CREATE TABLE public.video_playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.video_playlists(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.video_content(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  drip_delay_days integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Video Progress table (mirrors audio_progress)
CREATE TABLE public.video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.video_content(id) ON DELETE CASCADE,
  current_position_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Indexes
CREATE INDEX idx_video_content_program ON public.video_content(program_slug);
CREATE INDEX idx_video_playlists_program ON public.video_playlists(program_slug);
CREATE INDEX idx_video_playlist_items_playlist ON public.video_playlist_items(playlist_id);
CREATE INDEX idx_video_playlist_items_video ON public.video_playlist_items(video_id);
CREATE INDEX idx_video_progress_user ON public.video_progress(user_id);
CREATE INDEX idx_video_progress_video ON public.video_progress(video_id);

-- Enable RLS
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- RLS: video_content - authenticated read, admin full
CREATE POLICY "Authenticated users can read video content"
  ON public.video_content FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage video content"
  ON public.video_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: video_playlists - authenticated read, admin full
CREATE POLICY "Authenticated users can read video playlists"
  ON public.video_playlists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage video playlists"
  ON public.video_playlists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: video_playlist_items - authenticated read, admin full
CREATE POLICY "Authenticated users can read video playlist items"
  ON public.video_playlist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage video playlist items"
  ON public.video_playlist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: video_progress - users own records
CREATE POLICY "Users can read own video progress"
  ON public.video_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own video progress"
  ON public.video_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own video progress"
  ON public.video_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all video progress"
  ON public.video_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_video_content_updated_at
  BEFORE UPDATE ON public.video_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_progress_updated_at
  BEFORE UPDATE ON public.video_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for video files
INSERT INTO storage.buckets (id, name, public) VALUES ('video_files', 'video_files', true);

-- Storage RLS for video_files bucket
CREATE POLICY "Public read access for video files"
  ON storage.objects FOR SELECT USING (bucket_id = 'video_files');
CREATE POLICY "Admins can upload video files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video_files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update video files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'video_files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete video files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'video_files' AND public.has_role(auth.uid(), 'admin'));

-- Update cascade_program_slug_update to include video tables
CREATE OR REPLACE FUNCTION public.cascade_program_slug_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    UPDATE public.course_enrollments SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.program_rounds SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.program_auto_enrollment SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.audio_playlists SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.audio_content SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.feed_channels SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.orders SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.video_content SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
    UPDATE public.video_playlists SET program_slug = NEW.slug WHERE program_slug = OLD.slug;
  END IF;
  RETURN NEW;
END;
$function$;
