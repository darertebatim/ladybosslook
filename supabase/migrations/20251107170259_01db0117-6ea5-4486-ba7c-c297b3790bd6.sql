-- Allow admins to delete enrollments
CREATE POLICY "Admins can delete enrollments"
ON public.course_enrollments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));