-- ============================================
-- LADYBOSS PLANNER - DATABASE SCHEMA
-- ============================================

-- 1. User Tasks - Core task/routine items
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '☀️',
  color TEXT NOT NULL DEFAULT 'yellow',
  scheduled_date DATE,
  scheduled_time TIME,
  repeat_pattern TEXT NOT NULL DEFAULT 'none',
  repeat_days INTEGER[] DEFAULT '{}',
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_offset INTEGER NOT NULL DEFAULT 0,
  tag TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. User Subtasks - Subtasks for tasks
CREATE TABLE public.user_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Task Completions - Track daily task completions
CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, completed_date)
);

-- 4. Subtask Completions - Track daily subtask completions
CREATE TABLE public.subtask_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subtask_id UUID NOT NULL REFERENCES public.user_subtasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(subtask_id, completed_date)
);

-- 5. User Streaks - Track engagement streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completion_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Task Templates - Admin-created suggested routines
CREATE TABLE public.task_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '☀️',
  color TEXT NOT NULL DEFAULT 'yellow',
  category TEXT NOT NULL,
  description TEXT,
  suggested_time TIME,
  repeat_pattern TEXT NOT NULL DEFAULT 'daily',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. User Tags - User-created tags
CREATE TABLE public.user_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX idx_user_tasks_scheduled_date ON public.user_tasks(scheduled_date);
CREATE INDEX idx_user_tasks_user_date ON public.user_tasks(user_id, scheduled_date);
CREATE INDEX idx_task_completions_user_date ON public.task_completions(user_id, completed_date);
CREATE INDEX idx_task_completions_task_date ON public.task_completions(task_id, completed_date);
CREATE INDEX idx_subtask_completions_date ON public.subtask_completions(completed_date);
CREATE INDEX idx_user_subtasks_task_id ON public.user_subtasks(task_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtask_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

-- user_tasks policies
CREATE POLICY "Users can view their own tasks"
  ON public.user_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.user_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.user_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.user_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- user_subtasks policies
CREATE POLICY "Users can view subtasks of their tasks"
  ON public.user_subtasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_tasks 
    WHERE user_tasks.id = user_subtasks.task_id 
    AND user_tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can create subtasks for their tasks"
  ON public.user_subtasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_tasks 
    WHERE user_tasks.id = user_subtasks.task_id 
    AND user_tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update subtasks of their tasks"
  ON public.user_subtasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_tasks 
    WHERE user_tasks.id = user_subtasks.task_id 
    AND user_tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete subtasks of their tasks"
  ON public.user_subtasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_tasks 
    WHERE user_tasks.id = user_subtasks.task_id 
    AND user_tasks.user_id = auth.uid()
  ));

-- task_completions policies
CREATE POLICY "Users can view their own completions"
  ON public.task_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions"
  ON public.task_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions"
  ON public.task_completions FOR DELETE
  USING (auth.uid() = user_id);

-- subtask_completions policies
CREATE POLICY "Users can view their own subtask completions"
  ON public.subtask_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subtask completions"
  ON public.subtask_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtask completions"
  ON public.subtask_completions FOR DELETE
  USING (auth.uid() = user_id);

-- user_streaks policies
CREATE POLICY "Users can view their own streak"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streak"
  ON public.user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
  ON public.user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- task_templates policies (public read, admin write)
CREATE POLICY "Anyone can view active templates"
  ON public.task_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all templates"
  ON public.task_templates FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage templates"
  ON public.task_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- user_tags policies
CREATE POLICY "Users can view their own tags"
  ON public.user_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON public.user_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON public.user_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON public.user_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED DATA: LADYBOSS TEMPLATES
-- ============================================

INSERT INTO public.task_templates (title, emoji, color, category, description, suggested_time, repeat_pattern, display_order) VALUES
-- Morning Power-Up
('Review my goals', '🎯', 'yellow', 'morning', 'Start your day with clarity', '07:00', 'daily', 1),
('Gratitude practice', '🙏', 'mint', 'morning', 'Write 3 things you are grateful for', '07:15', 'daily', 2),
('Morning affirmation', '💪', 'pink', 'morning', 'Speak your daily affirmation', '07:30', 'daily', 3),
('Visualize success', '✨', 'lavender', 'morning', 'Picture your ideal day', '07:45', 'daily', 4),

-- Business Focus
('Priority task of the day', '🎯', 'peach', 'business', 'Focus on your #1 revenue task', '09:00', 'daily', 10),
('Check emails (30 min max)', '📧', 'sky', 'business', 'Batch process, then close', '10:00', 'daily', 11),
('Revenue-generating activity', '💰', 'yellow', 'business', 'Focus on money-making tasks', '11:00', 'daily', 12),
('Client follow-ups', '📞', 'lime', 'business', 'Nurture your relationships', '14:00', 'daily', 13),

-- Self-Care
('Drink water', '💧', 'sky', 'selfcare', 'Stay hydrated throughout the day', NULL, 'daily', 20),
('5-minute stretch', '🧘', 'mint', 'selfcare', 'Release tension and reset', '12:00', 'daily', 21),
('Read 10 pages', '📖', 'lavender', 'selfcare', 'Feed your mind', '20:00', 'daily', 22),
('Mindful breathing', '🌸', 'pink', 'selfcare', '3 deep breaths to center yourself', NULL, 'daily', 23),

-- Evening Wind-Down
('Journal reflection', '📝', 'lavender', 'evening', 'Capture your wins and learnings', '21:00', 'daily', 30),
('Plan tomorrow', '📋', 'sky', 'evening', 'Set up for a successful day', '21:15', 'daily', 31),
('Screen-free time', '😴', 'mint', 'evening', '30 minutes before bed', '21:30', 'daily', 32),
('Express gratitude', '💕', 'pink', 'evening', 'End the day with appreciation', '21:45', 'daily', 33),

-- Wellness
('Move your body', '🏃‍♀️', 'lime', 'wellness', 'Exercise for 30+ minutes', '06:30', 'daily', 40),
('Healthy meal prep', '🥗', 'mint', 'wellness', 'Nourish your body', '18:00', 'daily', 41),
('Take vitamins', '💊', 'peach', 'wellness', 'Daily supplements', '08:00', 'daily', 42),
('Track water intake', '🚰', 'sky', 'wellness', 'Aim for 8 glasses', NULL, 'daily', 43);