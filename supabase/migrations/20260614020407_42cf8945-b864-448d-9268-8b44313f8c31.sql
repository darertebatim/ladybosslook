-- Lock down dedication_claim_attempts: admins-only SELECT, block client INSERT (service role bypasses RLS)
DROP POLICY IF EXISTS "Admins can view dedication claim attempts" ON public.dedication_claim_attempts;
CREATE POLICY "Admins can view dedication claim attempts"
  ON public.dedication_claim_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "No client inserts on dedication claim attempts" ON public.dedication_claim_attempts;
CREATE POLICY "No client inserts on dedication claim attempts"
  ON public.dedication_claim_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Scope routine_plan_ratings reads to the rating owner
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.routine_plan_ratings;
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.routine_plan_ratings;
DROP POLICY IF EXISTS "Public can view ratings" ON public.routine_plan_ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON public.routine_plan_ratings;
DROP POLICY IF EXISTS "Admins can view all ratings" ON public.routine_plan_ratings;

CREATE POLICY "Users can view their own ratings"
  ON public.routine_plan_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ratings"
  ON public.routine_plan_ratings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));