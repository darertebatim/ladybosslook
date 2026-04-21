-- Replace the overly permissive SELECT policy on program_rounds
DROP POLICY IF EXISTS "Users can view rounds they are enrolled in or upcoming/active r" ON public.program_rounds;
DROP POLICY IF EXISTS "Users can view rounds they are enrolled in or upcoming/active rounds" ON public.program_rounds;

CREATE POLICY "Authenticated users can view rounds they are enrolled in or admins"
ON public.program_rounds
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_enrollments.round_id = program_rounds.id
      AND course_enrollments.user_id = auth.uid()
  )
);

-- Add explicit SELECT policy for admin_task_bank_subtasks so authenticated users can view subtasks for active tasks
CREATE POLICY "Authenticated users can view subtasks of active tasks"
ON public.admin_task_bank_subtasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_task_bank
    WHERE admin_task_bank.id = admin_task_bank_subtasks.task_id
      AND admin_task_bank.is_active = true
  )
);