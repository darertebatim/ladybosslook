-- Add balance payment option fields for deposit-type programs
ALTER TABLE public.program_catalog
ADD COLUMN balance_full_price integer,
ADD COLUMN balance_monthly_price integer,
ADD COLUMN balance_monthly_count integer,
ADD COLUMN balance_full_discount integer;

-- Update EWC program with balance payment options
UPDATE public.program_catalog
SET 
  balance_full_price = 74700,
  balance_monthly_price = 29900,
  balance_monthly_count = 3,
  balance_full_discount = 15000
WHERE slug = 'empowered-woman-coaching';