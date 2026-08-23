ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_valid;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_valid CHECK (status IN ('pending','paid','completed','failed','refunded','partially_refunded','cancelled','expired'));
UPDATE public.orders SET status = 'partially_refunded', refunded = false WHERE refund_amount > 0 AND refund_amount < amount;