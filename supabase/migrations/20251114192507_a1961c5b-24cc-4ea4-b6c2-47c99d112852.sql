-- Populate existing programs with Mailchimp tags
UPDATE program_catalog 
SET mailchimp_tags = '["one", "one_bilingual", "paid_class"]'::jsonb,
    mailchimp_program_name = 'Bilingual Power Class'
WHERE slug = 'bilingual-power-class';

UPDATE program_catalog 
SET mailchimp_tags = '["ccc"]'::jsonb,
    mailchimp_program_name = 'Courageous Character Course'
WHERE slug = 'courageous-character-course';

UPDATE program_catalog 
SET mailchimp_tags = '["money_literacy"]'::jsonb,
    mailchimp_program_name = 'Money Literacy Program'
WHERE slug = 'money-literacy-course';

UPDATE program_catalog 
SET mailchimp_tags = '["iqmoney"]'::jsonb,
    mailchimp_program_name = 'IQMoney Program'
WHERE slug = 'iqmoney-income-growth';

UPDATE program_catalog 
SET mailchimp_tags = '["ladyboss_coaching_program"]'::jsonb,
    mailchimp_program_name = 'Empowered Ladyboss Coaching'
WHERE slug = 'empowered-ladyboss-coaching';

UPDATE program_catalog 
SET mailchimp_tags = '["bsac"]'::jsonb,
    mailchimp_program_name = 'Business Startup Accelerator'
WHERE slug = 'business-startup-accelerator';

UPDATE program_catalog 
SET mailchimp_tags = '["bgac"]'::jsonb,
    mailchimp_program_name = 'Business Growth Accelerator'
WHERE slug = 'business-growth-accelerator';

UPDATE program_catalog 
SET mailchimp_tags = '["vip_club"]'::jsonb,
    mailchimp_program_name = 'Ladyboss VIP Club'
WHERE slug = 'ladyboss-vip-club';

UPDATE program_catalog 
SET mailchimp_tags = '["connection_literacy"]'::jsonb,
    mailchimp_program_name = 'Connection Literacy Program'
WHERE slug = 'connection-literacy-course';

UPDATE program_catalog 
SET mailchimp_tags = '["instagram_course"]'::jsonb,
    mailchimp_program_name = 'Instagram Growth Course'
WHERE slug = 'instagram-growth-course';

UPDATE program_catalog 
SET mailchimp_tags = '["private_session"]'::jsonb,
    mailchimp_program_name = 'Private Coaching Session'
WHERE slug = 'private-coaching-session';

UPDATE program_catalog 
SET mailchimp_tags = '["ewc"]'::jsonb,
    mailchimp_program_name = 'Empowered Woman Coaching'
WHERE slug = 'empowered-woman-coaching';