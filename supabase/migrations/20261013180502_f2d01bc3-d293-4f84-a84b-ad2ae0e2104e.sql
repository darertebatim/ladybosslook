ALTER TABLE public.program_catalog
  ADD COLUMN show_booking_on_success boolean NOT NULL DEFAULT true,
  ADD COLUMN success_video_url text;
COMMENT ON COLUMN public.program_catalog.show_booking_on_success IS 'Controls the booking box on payment success only; does not change meeting entitlement or booking elsewhere.';
COMMENT ON COLUMN public.program_catalog.success_video_url IS 'Optional payment-success guide video, separate from the promotional video_url.';