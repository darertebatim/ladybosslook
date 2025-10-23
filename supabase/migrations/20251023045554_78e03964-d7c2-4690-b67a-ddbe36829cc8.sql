-- Add policy for admins to view all programs (including inactive ones)
CREATE POLICY "Admins can view all programs"
ON public.program_catalog
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);