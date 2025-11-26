-- Allow additional valid order statuses used historically
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_valid;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_valid CHECK (status IN ('paid', 'pending', 'refunded', 'completed'));
