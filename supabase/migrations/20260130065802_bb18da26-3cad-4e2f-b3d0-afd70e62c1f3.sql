-- Create routines_bank table
CREATE TABLE public.routines_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image_url text,
  category text NOT NULL DEFAULT 'general',
  color text DEFAULT 'yellow',
  emoji text DEFAULT '✨',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routines_bank_tasks table (links tasks to routines)
CREATE TABLE public.routines_bank_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines_bank(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.admin_task_bank(id) ON DELETE SET NULL,
  title text NOT NULL,
  emoji text DEFAULT '☀️',
  duration_minutes integer DEFAULT 1,
  section_title text,
  task_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.routines_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines_bank_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for routines_bank (admin-only)
CREATE POLICY "Admins can manage routines bank"
ON public.routines_bank
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for routines_bank_tasks (admin-only)
CREATE POLICY "Admins can manage routines bank tasks"
ON public.routines_bank_tasks
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_routines_bank_tasks_routine_id ON public.routines_bank_tasks(routine_id);
CREATE INDEX idx_routines_bank_category ON public.routines_bank(category);

-- Trigger to update updated_at on routines_bank
CREATE TRIGGER update_routines_bank_updated_at
BEFORE UPDATE ON public.routines_bank
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();