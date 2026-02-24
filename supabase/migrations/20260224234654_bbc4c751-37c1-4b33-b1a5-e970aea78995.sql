
-- Create a table for managing media categories (audio & video)
CREATE TABLE public.media_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(type, slug)
);

-- Enable RLS
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Categories are publicly readable"
  ON public.media_categories FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage categories"
  ON public.media_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed existing audio categories
INSERT INTO public.media_categories (type, slug, label, emoji, sort_order) VALUES
  ('audio', 'audiobook', 'Audiobook', '📚', 0),
  ('audio', 'course', 'Course', '📖', 1),
  ('audio', 'podcast', 'Podcast', '🎙️', 2),
  ('audio', 'meditate', 'Meditate', '🧘', 3),
  ('audio', 'workout', 'Workout', '💪', 4),
  ('audio', 'soundscape', 'Soundscape', '🌊', 5),
  ('audio', 'affirmations', 'Affirmations', '✨', 6);

-- Seed existing video categories
INSERT INTO public.media_categories (type, slug, label, emoji, sort_order) VALUES
  ('video', 'tutorial', 'Tutorial', '📖', 0),
  ('video', 'course', 'Course', '🎓', 1),
  ('video', 'podcast', 'Podcast', '🎙️', 2),
  ('video', 'workshop', 'Workshop', '🔧', 3),
  ('video', 'motivation', 'Motivation', '🔥', 4),
  ('video', 'vlog', 'Vlog', '📹', 5);
