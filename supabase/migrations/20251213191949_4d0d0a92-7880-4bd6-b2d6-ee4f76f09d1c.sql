-- Add subscription_full_payment_price column to program_catalog
ALTER TABLE public.program_catalog 
ADD COLUMN IF NOT EXISTS subscription_full_payment_price integer DEFAULT NULL;

-- Update ewpluscoaching with the full payment price
UPDATE public.program_catalog 
SET subscription_full_payment_price = 119400
WHERE slug = 'ewpluscoaching';

-- Delete the duplicate ewpluscoaching-full entry
DELETE FROM public.program_catalog WHERE slug = 'ewpluscoaching-full';