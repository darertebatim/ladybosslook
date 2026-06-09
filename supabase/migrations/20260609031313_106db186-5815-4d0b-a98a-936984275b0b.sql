
CREATE POLICY "Admins can view all journal entries (analytics)"
  ON public.journal_entries FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all free form reflections"
  ON public.free_form_reflections FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all task completions"
  ON public.task_completions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all focus sessions"
  ON public.focus_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all reflection responses"
  ON public.user_reflection_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
