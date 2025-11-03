-- Create playlist_supplements table
CREATE TABLE public.playlist_supplements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.audio_playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'pdf', 'link')),
  url TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlist_supplements ENABLE ROW LEVEL SECURITY;

-- Admins can manage all supplements
CREATE POLICY "Admins can manage supplements"
  ON public.playlist_supplements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view supplements for playlists they have access to
CREATE POLICY "Users can view supplements for accessible playlists"
  ON public.playlist_supplements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM audio_playlists ap
      WHERE ap.id = playlist_supplements.playlist_id
      AND (
        ap.is_free = true
        OR EXISTS (
          SELECT 1
          FROM course_enrollments ce
          WHERE ce.user_id = auth.uid()
          AND ce.program_slug = ap.program_slug
          AND ce.status = 'active'
        )
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Create index for better performance
CREATE INDEX idx_playlist_supplements_playlist_id ON public.playlist_supplements(playlist_id);

-- Trigger for updated_at
CREATE TRIGGER update_playlist_supplements_updated_at
  BEFORE UPDATE ON public.playlist_supplements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();