-- Drop the existing SELECT policy on form_submissions
DROP POLICY IF EXISTS "Only admins can view form submissions" ON public.form_submissions;

-- Create a new, more explicit SELECT policy that requires authentication
CREATE POLICY "Only authenticated admins can view form submissions"
ON public.form_submissions
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add an explicit DENY policy for anonymous users (defense in depth)
CREATE POLICY "Anonymous users cannot view form submissions"
ON public.form_submissions
FOR SELECT
TO anon
USING (false);