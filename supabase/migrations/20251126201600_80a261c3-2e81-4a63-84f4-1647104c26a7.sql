-- Add refund tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS refunded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS refund_amount integer;

-- Create index for faster refund queries
CREATE INDEX IF NOT EXISTS idx_orders_refunded ON public.orders(refunded) WHERE refunded = true;