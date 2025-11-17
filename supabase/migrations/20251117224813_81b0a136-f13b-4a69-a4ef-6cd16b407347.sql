-- Allow users to enroll themselves in courses
CREATE POLICY "Users can enroll themselves in courses"
ON public.course_enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);