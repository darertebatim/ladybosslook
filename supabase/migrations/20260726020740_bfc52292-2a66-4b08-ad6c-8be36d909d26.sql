CREATE POLICY "Public can view auto-enrollment"
ON public.program_auto_enrollment
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.program_auto_enrollment TO anon;

CREATE POLICY "Public can view content hosts"
ON public.content_hosts
FOR SELECT
TO anon
USING (true);

GRANT SELECT ON public.content_hosts TO anon;