-- Add 'webinar' to the allowed program types
ALTER TABLE public.program_catalog 
DROP CONSTRAINT IF EXISTS program_catalog_type_check;

ALTER TABLE public.program_catalog 
ADD CONSTRAINT program_catalog_type_check 
CHECK (type IN ('course', 'group-coaching', '1o1-session', 'event', 'webinar'));

-- Update existing enrollments to ensure they have correct program_slug
-- This will map old course names to their current slugs
UPDATE public.course_enrollments
SET program_slug = CASE course_name
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
  WHEN 'Bilingual Power Class - کلاس قدرت دو زبانه' THEN 'bilingual-power-class'
  ELSE program_slug
END
WHERE program_slug IS NULL OR program_slug = '';