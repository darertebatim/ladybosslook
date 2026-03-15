
-- Add badge_image_url column to routines_bank for challenge completion badges
ALTER TABLE public.routines_bank ADD COLUMN IF NOT EXISTS badge_image_url text;

-- Create table to store earned challenge badges
CREATE TABLE public.user_challenge_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  routine_id uuid REFERENCES public.routines_bank(id) ON DELETE CASCADE NOT NULL,
  badge_image_url text NOT NULL,
  routine_title text NOT NULL,
  routine_emoji text NOT NULL DEFAULT '✨',
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, routine_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_badges ENABLE ROW LEVEL SECURITY;

-- Users can read their own badges
CREATE POLICY "Users can read own badges"
  ON public.user_challenge_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert policy for server-side or authenticated user
CREATE POLICY "Users can earn badges"
  ON public.user_challenge_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
