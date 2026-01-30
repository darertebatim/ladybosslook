-- Create admin task bank table - a bank of reusable task templates
-- This mirrors user_tasks structure but without user_id or scheduling fields

CREATE TABLE public.admin_task_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '☀️',
  color TEXT NOT NULL DEFAULT 'yellow',
  -- Pro link fields
  pro_link_type TEXT,
  pro_link_value TEXT,
  linked_playlist_id UUID,
  -- Goal fields
  goal_enabled BOOLEAN NOT NULL DEFAULT false,
  goal_type TEXT, -- 'timer' or 'count'
  goal_target INTEGER,
  goal_unit TEXT,
  -- Repeat settings (for default values when added to planner)
  repeat_pattern TEXT NOT NULL DEFAULT 'none',
  repeat_days INTEGER[] DEFAULT '{}',
  -- Reminder default
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  -- Organization
  tag TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtasks table for task bank
CREATE TABLE public.admin_task_bank_subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.admin_task_bank(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_task_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_task_bank_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins only
CREATE POLICY "Admins can manage task bank"
  ON public.admin_task_bank
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage task bank subtasks"
  ON public.admin_task_bank_subtasks
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update timestamp trigger
CREATE TRIGGER update_admin_task_bank_updated_at
  BEFORE UPDATE ON public.admin_task_bank
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for sorting
CREATE INDEX idx_admin_task_bank_sort ON public.admin_task_bank(sort_order, created_at);