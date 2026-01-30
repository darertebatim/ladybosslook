-- Create routines_bank_sections table for rich section content
CREATE TABLE public.routines_bank_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES public.routines_bank(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  image_url text,
  section_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routines_bank_sections ENABLE ROW LEVEL SECURITY;

-- Admin-only policy
CREATE POLICY "Admins can manage routine sections"
  ON public.routines_bank_sections FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add section_id to routines_bank_tasks
ALTER TABLE public.routines_bank_tasks 
ADD COLUMN section_id uuid REFERENCES public.routines_bank_sections(id) ON DELETE SET NULL;