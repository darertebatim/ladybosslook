CREATE POLICY "Admins can view all lesson progress"
ON public.learn_lesson_progress
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));