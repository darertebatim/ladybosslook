-- Update program_rounds RLS policy to allow enrolled users to see their completed rounds
DROP POLICY IF EXISTS "Anyone can view active and upcoming rounds" ON public.program_rounds;

CREATE POLICY "Users can view rounds they are enrolled in or upcoming/active rounds"
ON public.program_rounds
FOR SELECT
USING (
  -- Admins can see all
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Anyone can see upcoming/active rounds
  (status = ANY (ARRAY['upcoming'::text, 'active'::text]))
  OR
  -- Enrolled users can see their completed rounds
  (status = 'completed' AND EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_enrollments.round_id = program_rounds.id
    AND course_enrollments.user_id = auth.uid()
  ))
);