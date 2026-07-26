DROP POLICY IF EXISTS "Active instructors viewable by authenticated users" ON public.instructors;

CREATE POLICY "Active instructors are publicly viewable"
ON public.instructors
FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.instructors TO anon;
GRANT SELECT ON public.instructors TO authenticated;
GRANT ALL ON public.instructors TO service_role;