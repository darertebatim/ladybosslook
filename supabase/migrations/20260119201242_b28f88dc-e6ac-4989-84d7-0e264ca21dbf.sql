-- Add is_pro_routine flag to routine_plans
ALTER TABLE routine_plans 
ADD COLUMN IF NOT EXISTS is_pro_routine boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN routine_plans.is_pro_routine IS 
  'True for routines based on playlists/app features, false for simple task routines';

-- Create routine_task_templates table for Pro Task library
CREATE TABLE IF NOT EXISTS routine_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 5,
  icon text NOT NULL DEFAULT 'Sparkles',
  pro_link_type text NOT NULL,
  pro_link_value text,
  linked_playlist_id uuid REFERENCES audio_playlists(id) ON DELETE SET NULL,
  description text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on routine_task_templates
ALTER TABLE routine_task_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy: Admins can manage task templates
CREATE POLICY "Admins can manage task templates" ON routine_task_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_routine_task_templates_pro_link_type 
  ON routine_task_templates(pro_link_type);

CREATE INDEX IF NOT EXISTS idx_routine_plans_is_pro_routine 
  ON routine_plans(is_pro_routine);