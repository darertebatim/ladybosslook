
-- Create playlist_saves table for free playlist gating
CREATE TABLE public.playlist_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.audio_playlists(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, playlist_id)
);

-- Enable RLS
ALTER TABLE public.playlist_saves ENABLE ROW LEVEL SECURITY;

-- Users can view their own saves
CREATE POLICY "Users can view their own playlist saves"
ON public.playlist_saves FOR SELECT
USING (auth.uid() = user_id);

-- Users can save playlists
CREATE POLICY "Users can save playlists"
ON public.playlist_saves FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave playlists
CREATE POLICY "Users can unsave playlists"
ON public.playlist_saves FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_playlist_saves_user_id ON public.playlist_saves(user_id);
CREATE INDEX idx_playlist_saves_playlist_id ON public.playlist_saves(playlist_id);
