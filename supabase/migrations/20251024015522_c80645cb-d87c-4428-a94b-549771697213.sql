-- Fix search_path for map_course_name_to_slug function
CREATE OR REPLACE FUNCTION public.map_course_name_to_slug(course_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Secure the documents storage bucket by making it private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Add RLS policies for authenticated access to documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);