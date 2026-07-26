CREATE POLICY "Public can view active rounds"
ON public.program_rounds
FOR SELECT
TO anon, authenticated
USING (status IN ('upcoming', 'active'));

GRANT SELECT ON public.program_rounds TO anon;