CREATE POLICY "Anyone can read lead campaign settings"
ON public.app_settings FOR SELECT TO anon
USING (key LIKE 'lead_campaigns_%');
GRANT SELECT ON public.app_settings TO anon;