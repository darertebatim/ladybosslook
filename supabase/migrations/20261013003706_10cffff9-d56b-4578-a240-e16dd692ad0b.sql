GRANT INSERT ON public.webinar_calendar_clicks TO anon, authenticated;
GRANT SELECT ON public.webinar_calendar_clicks TO authenticated;
GRANT ALL ON public.webinar_calendar_clicks TO service_role;
CREATE INDEX IF NOT EXISTS idx_wcc_page_created ON public.webinar_calendar_clicks(page, created_at DESC);