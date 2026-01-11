-- Create audio_bookmarks table for saving timestamps with notes
CREATE TABLE public.audio_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_id UUID NOT NULL REFERENCES public.audio_content(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_audio_bookmarks_user_audio ON public.audio_bookmarks(user_id, audio_id);

-- Enable RLS
ALTER TABLE public.audio_bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON public.audio_bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own bookmarks
CREATE POLICY "Users can create their own bookmarks"
ON public.audio_bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON public.audio_bookmarks
FOR DELETE
USING (auth.uid() = user_id);