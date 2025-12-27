-- Update Five Language program with proper Mailchimp tags
UPDATE program_catalog 
SET 
  mailchimp_tags = '["five_language", "paid_customer"]'::jsonb,
  mailchimp_program_name = 'Five Language of Empowered Woman'
WHERE slug = 'Five-Language';