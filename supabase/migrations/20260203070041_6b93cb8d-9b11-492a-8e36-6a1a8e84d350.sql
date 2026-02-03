-- Create app_review_events table to track review prompts and feedback
CREATE TABLE public.app_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'prompted', 'rated_in_app', 'native_shown', 'feedback_given', 'dismissed'
  in_app_rating INTEGER, -- 1-5 if rated
  feedback TEXT, -- If user gave feedback
  trigger_source TEXT, -- 'track_complete', 'playlist_complete', 'streak_milestone', 'course_complete', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_review_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own review events
CREATE POLICY "Users can insert own review events"
ON public.app_review_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own review events
CREATE POLICY "Users can read own review events"
ON public.app_review_events
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all review events
CREATE POLICY "Admins can read all review events"
ON public.app_review_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_app_review_events_user_id ON public.app_review_events(user_id);
CREATE INDEX idx_app_review_events_event_type ON public.app_review_events(event_type);
CREATE INDEX idx_app_review_events_created_at ON public.app_review_events(created_at DESC);