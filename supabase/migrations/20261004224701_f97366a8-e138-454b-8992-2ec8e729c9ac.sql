ALTER TABLE public.one_on_one_bookings ADD COLUMN IF NOT EXISTS chat_notified_at timestamptz;
UPDATE public.one_on_one_bookings SET chat_notified_at = now() WHERE chat_notified_at IS NULL;