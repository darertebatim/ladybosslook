-- Phase 1: Create program_catalog table
CREATE TABLE IF NOT EXISTS public.program_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('course', 'group-coaching', '1o1-session', 'event')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one-time', 'subscription', 'free')),
  price_amount INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on program_catalog
ALTER TABLE public.program_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can view active programs
CREATE POLICY "Anyone can view active programs"
ON public.program_catalog
FOR SELECT
USING (is_active = true);

-- Only admins can modify programs
CREATE POLICY "Admins can insert programs"
ON public.program_catalog
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update programs"
ON public.program_catalog
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete programs"
ON public.program_catalog
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Phase 2: Add program_slug to course_enrollments
ALTER TABLE public.course_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;

-- Phase 3: Add program_slug and payment_type to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS program_slug TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_type TEXT;

-- Phase 4: Create a mapping function for legacy course names to slugs
CREATE OR REPLACE FUNCTION public.map_course_name_to_slug(course_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE course_name
    WHEN 'IQMoney Course - Income Growth' THEN 'iqmoney-income-growth'
    WHEN 'Money Literacy Course' THEN 'money-literacy-course'
    WHEN 'Ladyboss VIP Club Group Coaching' THEN 'ladyboss-vip-club'
    WHEN 'Empowered Ladyboss Group Coaching' THEN 'empowered-ladyboss-coaching'
    WHEN 'Business Growth Accelerator - 3-Month 1o1 Weekly Session' THEN 'business-growth-accelerator'
    WHEN 'Business Startup Accelerator - 3-Month 1o1 Weekly Session' THEN 'business-startup-accelerator'
    WHEN 'Instagram Fast Growth Course' THEN 'instagram-growth-course'
    WHEN '1-Hour Private Session with Razie' THEN 'private-coaching-session'
    WHEN 'Connection Literacy Course' THEN 'connection-literacy-course'
    WHEN 'Courageous Character Course' THEN 'courageous-character-course'
    WHEN 'Courageous Character Workshop' THEN 'courageous-character-course'
    WHEN 'Money Literacy Workshop' THEN 'money-literacy-course'
    WHEN 'IQ Money Program' THEN 'iqmoney-income-growth'
    WHEN 'Ladyboss Coaching' THEN 'empowered-ladyboss-coaching'
    WHEN 'Networking Program' THEN 'connection-literacy-course'
    WHEN 'Assertiveness Training' THEN 'courageous-character-course'
    ELSE NULL
  END;
END;
$$;

-- Phase 5: Migrate existing course_enrollments data
UPDATE public.course_enrollments
SET program_slug = public.map_course_name_to_slug(course_name)
WHERE program_slug IS NULL AND course_name IS NOT NULL;

-- Phase 6: Migrate existing orders data  
UPDATE public.orders
SET program_slug = public.map_course_name_to_slug(product_name),
    payment_type = 'one-time'
WHERE program_slug IS NULL AND product_name IS NOT NULL;

-- Phase 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_enrollments_program_slug ON public.course_enrollments(program_slug);
CREATE INDEX IF NOT EXISTS idx_orders_program_slug ON public.orders(program_slug);
CREATE INDEX IF NOT EXISTS idx_program_catalog_slug ON public.program_catalog(slug);
CREATE INDEX IF NOT EXISTS idx_program_catalog_type ON public.program_catalog(type);
CREATE INDEX IF NOT EXISTS idx_program_catalog_payment_type ON public.program_catalog(payment_type);

-- Phase 8: Create trigger for updated_at on program_catalog
CREATE OR REPLACE FUNCTION public.update_program_catalog_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_program_catalog_updated_at
BEFORE UPDATE ON public.program_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_program_catalog_updated_at();