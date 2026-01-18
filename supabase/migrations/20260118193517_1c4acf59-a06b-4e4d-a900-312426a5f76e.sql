-- Create storage bucket for routine covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('routine-covers', 'routine-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for routine covers (using IF NOT EXISTS pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view routine covers' AND tablename = 'objects') THEN
    CREATE POLICY "Anyone can view routine covers" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'routine-covers');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload routine covers' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can upload routine covers" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'routine-covers' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update routine covers' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can update routine covers" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'routine-covers' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete routine covers' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can delete routine covers" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'routine-covers' AND public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Seed initial categories
INSERT INTO public.routine_categories (name, slug, icon, color, display_order) VALUES
('Morning Routines', 'morning-routines', 'Sun', '#FEF3C7', 1),
('Self-Care', 'self-care', 'Heart', '#FCE7F3', 2),
('Business & Work', 'business-work', 'Briefcase', '#DBEAFE', 3),
('Evening Wind-Down', 'evening-wind-down', 'Moon', '#E9D5FF', 4),
('Health & Fitness', 'health-fitness', 'Dumbbell', '#D1FAE5', 5),
('Mindfulness', 'mindfulness', 'Brain', '#E0E7FF', 6)
ON CONFLICT (slug) DO NOTHING;