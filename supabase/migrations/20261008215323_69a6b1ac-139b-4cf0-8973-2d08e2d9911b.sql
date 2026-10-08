CREATE POLICY "Enrolled students can access course lesson audio"
ON public.audio_content FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.learn_lessons ll
    JOIN public.learn_modules lm ON lm.id = ll.module_id
    WHERE ll.audio_id = audio_content.id
      AND ll.is_published IS NOT FALSE
      AND lm.is_published IS NOT FALSE
      AND public.can_access_learn_course(auth.uid(), lm.course_id)
  )
);