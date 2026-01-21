-- Update the RLS policy for feed_channels to support new channel types
DROP POLICY IF EXISTS "Users can view accessible channels" ON public.feed_channels;

CREATE POLICY "Users can view accessible channels" 
ON public.feed_channels 
FOR SELECT 
USING (
  (type = 'general') OR 
  (type = 'all_enrolled' AND EXISTS (
    SELECT 1 FROM course_enrollments ce 
    WHERE ce.user_id = auth.uid() AND ce.status = 'active'
  )) OR
  (type = 'all_paid' AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = auth.uid() AND o.status = 'completed'
  )) OR
  (type = 'program' AND program_slug IN (
    SELECT DISTINCT ce.program_slug 
    FROM course_enrollments ce 
    WHERE ce.user_id = auth.uid()
  )) OR 
  (type = 'round' AND round_id IN (
    SELECT ce.round_id 
    FROM course_enrollments ce 
    WHERE ce.user_id = auth.uid()
  )) OR 
  has_role(auth.uid(), 'admin'::app_role)
);