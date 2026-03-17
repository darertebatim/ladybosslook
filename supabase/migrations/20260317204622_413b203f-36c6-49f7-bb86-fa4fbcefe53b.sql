
-- Focus Routine Session tracking tables

CREATE TABLE public.routine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id TEXT NOT NULL,
  routine_title TEXT NOT NULL,
  routine_emoji TEXT DEFAULT '✨',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_seconds INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_skipped INTEGER DEFAULT 0,
  tasks_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.routine_session_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.routine_sessions(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_emoji TEXT DEFAULT '📝',
  task_order INTEGER DEFAULT 0,
  target_seconds INTEGER DEFAULT 0,
  actual_seconds INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_session_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for routine_sessions
CREATE POLICY "Users can view own sessions"
  ON public.routine_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sessions"
  ON public.routine_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.routine_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for routine_session_tasks
CREATE POLICY "Users can view own session tasks"
  ON public.routine_session_tasks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.routine_sessions rs
    WHERE rs.id = routine_session_tasks.session_id
    AND rs.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own session tasks"
  ON public.routine_session_tasks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.routine_sessions rs
    WHERE rs.id = routine_session_tasks.session_id
    AND rs.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own session tasks"
  ON public.routine_session_tasks FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.routine_sessions rs
    WHERE rs.id = routine_session_tasks.session_id
    AND rs.user_id = auth.uid()
  ));

-- Index for fast session lookups
CREATE INDEX idx_routine_sessions_user_routine ON public.routine_sessions(user_id, routine_id);
CREATE INDEX idx_routine_session_tasks_session ON public.routine_session_tasks(session_id);
