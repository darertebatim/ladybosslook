CREATE POLICY "Public can read webinar round routing"
ON public.webinar_round_routing
FOR SELECT
TO anon
USING (true);
GRANT SELECT ON public.webinar_round_routing TO anon;