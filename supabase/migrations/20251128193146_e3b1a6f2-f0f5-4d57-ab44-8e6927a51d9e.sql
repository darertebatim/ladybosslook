-- Add 'deposit' to the payment_type check constraint
ALTER TABLE program_catalog DROP CONSTRAINT IF EXISTS program_catalog_payment_type_check;

ALTER TABLE program_catalog ADD CONSTRAINT program_catalog_payment_type_check 
CHECK (payment_type IN ('one-time', 'subscription', 'free', 'deposit'));