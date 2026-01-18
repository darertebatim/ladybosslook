-- Create routine_categories table
CREATE TABLE public.routine_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  color text NOT NULL DEFAULT 'yellow',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create routine_plans table
CREATE TABLE public.routine_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.routine_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image_url text,
  icon text NOT NULL DEFAULT 'Sun',
  color text NOT NULL DEFAULT 'yellow',
  estimated_minutes integer NOT NULL DEFAULT 10,
  points integer NOT NULL DEFAULT 10,
  is_featured boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create routine_plan_sections table
CREATE TABLE public.routine_plan_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.routine_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  image_url text,
  section_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create routine_plan_tasks table
CREATE TABLE public.routine_plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.routine_plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 1,
  icon text NOT NULL DEFAULT 'CheckCircle',
  task_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create routine_plan_ratings table
CREATE TABLE public.routine_plan_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.routine_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, user_id)
);

-- Create user_routine_plans table
CREATE TABLE public.user_routine_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.routine_plans(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, plan_id)
);

-- Enable RLS on all tables
ALTER TABLE public.routine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_plan_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_plan_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routine_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for categories, plans, sections, tasks (active only)
CREATE POLICY "Anyone can read active categories" 
ON public.routine_categories FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can read active plans" 
ON public.routine_plans FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can read active sections" 
ON public.routine_plan_sections FOR SELECT 
USING (is_active = true);

CREATE POLICY "Anyone can read active tasks" 
ON public.routine_plan_tasks FOR SELECT 
USING (is_active = true);

-- Admin write access for content tables
CREATE POLICY "Admins can manage categories" 
ON public.routine_categories FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage plans" 
ON public.routine_plans FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sections" 
ON public.routine_plan_sections FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tasks" 
ON public.routine_plan_tasks FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- User-specific policies for ratings
CREATE POLICY "Users can read all ratings" 
ON public.routine_plan_ratings FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own ratings" 
ON public.routine_plan_ratings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.routine_plan_ratings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- User-specific policies for added routine plans
CREATE POLICY "Users can read their own routine plans" 
ON public.user_routine_plans FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add routine plans" 
ON public.user_routine_plans FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their routine plans" 
ON public.user_routine_plans FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their routine plans" 
ON public.user_routine_plans FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add validation trigger for rating range (1-5)
CREATE OR REPLACE FUNCTION public.validate_rating_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER validate_rating_before_insert_update
BEFORE INSERT OR UPDATE ON public.routine_plan_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_rating_range();