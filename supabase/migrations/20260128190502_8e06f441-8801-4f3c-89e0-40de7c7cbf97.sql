-- Create breathing_exercises table
CREATE TABLE public.breathing_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'calm',
  emoji TEXT DEFAULT '🫁',
  inhale_seconds INTEGER NOT NULL DEFAULT 4,
  inhale_hold_seconds INTEGER NOT NULL DEFAULT 0,
  exhale_seconds INTEGER NOT NULL DEFAULT 4,
  exhale_hold_seconds INTEGER NOT NULL DEFAULT 0,
  inhale_method TEXT NOT NULL DEFAULT 'nose',
  exhale_method TEXT NOT NULL DEFAULT 'mouth',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add check constraint for category
ALTER TABLE public.breathing_exercises
ADD CONSTRAINT breathing_exercises_category_check 
CHECK (category IN ('morning', 'energize', 'focus', 'calm', 'night'));

-- Add check constraint for methods
ALTER TABLE public.breathing_exercises
ADD CONSTRAINT breathing_exercises_inhale_method_check 
CHECK (inhale_method IN ('nose', 'mouth'));

ALTER TABLE public.breathing_exercises
ADD CONSTRAINT breathing_exercises_exhale_method_check 
CHECK (exhale_method IN ('nose', 'mouth'));

-- Enable RLS
ALTER TABLE public.breathing_exercises ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active breathing exercises"
ON public.breathing_exercises
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage breathing exercises"
ON public.breathing_exercises
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_breathing_exercises_updated_at
BEFORE UPDATE ON public.breathing_exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create breathing_sessions table for tracking
CREATE TABLE public.breathing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.breathing_exercises(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sessions
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for sessions
CREATE POLICY "Users can view their own breathing sessions"
ON public.breathing_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own breathing sessions"
ON public.breathing_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all breathing sessions"
ON public.breathing_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial breathing exercises
INSERT INTO public.breathing_exercises (name, description, category, emoji, inhale_seconds, inhale_hold_seconds, exhale_seconds, exhale_hold_seconds, inhale_method, exhale_method, sort_order) VALUES
('Calm Breathing', 'Lower your heart rate and feel more relaxed with this simple breathing pattern.', 'calm', '🏝️', 4, 0, 6, 0, 'nose', 'mouth', 1),
('Box Breathing', 'A powerful technique used by Navy SEALs to stay calm and focused under pressure.', 'focus', '📦', 4, 4, 4, 4, 'nose', 'mouth', 2),
('Energy Boost', 'Quick energizing breaths to wake up your body and mind.', 'energize', '⚡', 2, 0, 2, 0, 'nose', 'mouth', 3),
('4-7-8 Sleep', 'A relaxing breath pattern to help you fall asleep faster.', 'night', '🌙', 4, 7, 8, 0, 'nose', 'mouth', 4),
('Morning Refresh', 'Start your day with deep, invigorating breaths.', 'morning', '🌅', 5, 2, 5, 0, 'nose', 'mouth', 5),
('Focus Flow', 'Improve concentration and mental clarity with balanced breathing.', 'focus', '🎯', 4, 4, 4, 4, 'nose', 'nose', 6),
('Stress Relief', 'Extended exhales activate your parasympathetic nervous system.', 'calm', '🧘', 4, 0, 8, 0, 'nose', 'mouth', 7),
('Power Up', 'Short powerful breaths to boost your energy before a workout.', 'energize', '🔥', 3, 0, 3, 0, 'mouth', 'mouth', 8),
('Deep Rest', 'Gentle, slow breathing to prepare for deep relaxation.', 'night', '😴', 5, 3, 7, 0, 'nose', 'mouth', 9),
('Wake Up', 'Rhythmic breathing to gently wake your body and mind.', 'morning', '☀️', 4, 2, 4, 2, 'nose', 'mouth', 10);