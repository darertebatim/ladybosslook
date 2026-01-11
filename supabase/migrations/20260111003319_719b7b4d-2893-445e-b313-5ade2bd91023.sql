-- Create feed_channels table
CREATE TABLE public.feed_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'program', 'round')),
  program_slug TEXT,
  round_id UUID REFERENCES public.program_rounds(id) ON DELETE CASCADE,
  cover_image_url TEXT,
  allow_reactions BOOLEAN NOT NULL DEFAULT true,
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed_posts table
CREATE TABLE public.feed_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.feed_channels(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  post_type TEXT NOT NULL DEFAULT 'announcement' CHECK (post_type IN ('announcement', 'drip_unlock', 'session_reminder', 'media', 'discussion')),
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  action_type TEXT DEFAULT 'none' CHECK (action_type IN ('none', 'play_audio', 'join_session', 'view_materials', 'external_link')),
  action_data JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  send_push BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed_reactions table
CREATE TABLE public.feed_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('heart', 'fire', 'clap', 'lightbulb', 'pray')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

-- Create feed_comments table
CREATE TABLE public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feed_post_reads table
CREATE TABLE public.feed_post_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_feed_channels_type ON public.feed_channels(type);
CREATE INDEX idx_feed_channels_program_slug ON public.feed_channels(program_slug);
CREATE INDEX idx_feed_channels_round_id ON public.feed_channels(round_id);
CREATE INDEX idx_feed_posts_channel_id ON public.feed_posts(channel_id);
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_is_pinned ON public.feed_posts(is_pinned);
CREATE INDEX idx_feed_reactions_post_id ON public.feed_reactions(post_id);
CREATE INDEX idx_feed_reactions_user_id ON public.feed_reactions(user_id);
CREATE INDEX idx_feed_comments_post_id ON public.feed_comments(post_id);
CREATE INDEX idx_feed_post_reads_user_id ON public.feed_post_reads(user_id);

-- Enable RLS on all tables
ALTER TABLE public.feed_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_post_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feed_channels
-- Users can see general channels, or program/round channels they're enrolled in
CREATE POLICY "Users can view accessible channels" ON public.feed_channels
  FOR SELECT USING (
    type = 'general'
    OR (type = 'program' AND program_slug IN (
      SELECT DISTINCT ce.program_slug FROM public.course_enrollments ce WHERE ce.user_id = auth.uid()
    ))
    OR (type = 'round' AND round_id IN (
      SELECT ce.round_id FROM public.course_enrollments ce WHERE ce.user_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage channels" ON public.feed_channels
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feed_posts
CREATE POLICY "Users can view posts in accessible channels" ON public.feed_posts
  FOR SELECT USING (
    channel_id IN (SELECT id FROM public.feed_channels)
  );

CREATE POLICY "Admins can manage posts" ON public.feed_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feed_reactions
CREATE POLICY "Users can view all reactions" ON public.feed_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add own reactions" ON public.feed_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.feed_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for feed_comments
CREATE POLICY "Users can view non-hidden comments" ON public.feed_comments
  FOR SELECT USING (
    is_hidden = false OR auth.uid() = user_id OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can add own comments" ON public.feed_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.feed_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.feed_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.feed_comments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for feed_post_reads
CREATE POLICY "Users can manage own read status" ON public.feed_post_reads
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at on feed_posts
CREATE TRIGGER update_feed_posts_updated_at
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for feed_posts and feed_comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_reactions;

-- Insert default General channel
INSERT INTO public.feed_channels (name, slug, type, sort_order)
VALUES ('General', 'general', 'general', 0);