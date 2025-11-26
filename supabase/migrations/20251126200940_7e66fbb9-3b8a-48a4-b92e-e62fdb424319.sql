-- Add billing address columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS billing_city text,
ADD COLUMN IF NOT EXISTS billing_state text,
ADD COLUMN IF NOT EXISTS billing_country text;