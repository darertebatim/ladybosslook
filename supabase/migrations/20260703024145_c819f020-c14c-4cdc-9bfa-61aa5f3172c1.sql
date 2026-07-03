-- Wave 2: replace merged industry options with full granular list (55 specifics + Other).
-- Group slugs must match aperture_buckets.industry_group_slug so bucket loading is unchanged.

-- 1) Deactivate all existing industries; keep for FK integrity.
UPDATE public.aperture_industries SET is_active = false;

-- 2) Insert new granular industries (label, slug, group_label, group_slug, sort_order).
INSERT INTO public.aperture_industries (slug, label, group_label, group_slug, sort_order, is_active) VALUES
  -- Food & Hospitality
  ('restaurant','Restaurant','Food & Hospitality','food-hospitality',1010,true),
  ('cafe','Café','Food & Hospitality','food-hospitality',1020,true),
  ('bakery','Bakery','Food & Hospitality','food-hospitality',1030,true),
  ('catering','Catering','Food & Hospitality','food-hospitality',1040,true),
  ('food_retail','Food retail','Food & Hospitality','food-hospitality',1050,true),
  ('food_import','Food import','Food & Hospitality','food-hospitality',1060,true),
  ('specialty_grocery','Specialty grocery','Food & Hospitality','food-hospitality',1070,true),
  -- Beauty & Wellness
  ('hair_salon','Hair salon','Beauty & Wellness','beauty-wellness',2010,true),
  ('barbershop','Barbershop','Beauty & Wellness','beauty-wellness',2020,true),
  ('nail_salon','Nail salon','Beauty & Wellness','beauty-wellness',2030,true),
  ('skincare','Skincare','Beauty & Wellness','beauty-wellness',2040,true),
  ('esthetics','Esthetics','Beauty & Wellness','beauty-wellness',2050,true),
  ('spa','Spa','Beauty & Wellness','beauty-wellness',2060,true),
  -- Retail & E-Commerce
  ('clothing_boutique','Clothing boutique','Retail & E-Commerce','retail-ecommerce',3010,true),
  ('fashion_boutique','Fashion boutique','Retail & E-Commerce','retail-ecommerce',3020,true),
  ('jewelry_retail','Jewelry','Retail & E-Commerce','retail-ecommerce',3030,true),
  ('home_decor','Home décor','Retail & E-Commerce','retail-ecommerce',3040,true),
  ('furniture','Furniture','Retail & E-Commerce','retail-ecommerce',3050,true),
  ('general_retail','General retail','Retail & E-Commerce','retail-ecommerce',3060,true),
  ('gift_shop','Gift shop','Retail & E-Commerce','retail-ecommerce',3070,true),
  ('ecommerce','E-commerce','Retail & E-Commerce','retail-ecommerce',3080,true),
  -- Professional Services & Agencies
  ('accounting','Accounting','Professional Services & Agencies','professional-services',4010,true),
  ('bookkeeping','Bookkeeping','Professional Services & Agencies','professional-services',4020,true),
  ('tax','Tax','Professional Services & Agencies','professional-services',4030,true),
  ('legal_services','Legal services','Professional Services & Agencies','professional-services',4040,true),
  ('insurance','Insurance','Professional Services & Agencies','professional-services',4050,true),
  ('financial_advising','Financial advising','Professional Services & Agencies','professional-services',4060,true),
  ('mortgage','Mortgage','Professional Services & Agencies','professional-services',4070,true),
  ('digital_marketing_agency','Digital marketing agency','Professional Services & Agencies','professional-services',4080,true),
  ('social_media_agency','Social media agency','Professional Services & Agencies','professional-services',4090,true),
  -- Coaching, Consulting & Therapy
  ('coaching','Coaching','Coaching, Consulting & Therapy','coaching-consulting-therapy',5010,true),
  ('consulting','Consulting','Coaching, Consulting & Therapy','coaching-consulting-therapy',5020,true),
  ('online_courses','Online courses','Coaching, Consulting & Therapy','coaching-consulting-therapy',5030,true),
  ('mental_health','Mental health','Coaching, Consulting & Therapy','coaching-consulting-therapy',5040,true),
  ('therapy','Therapy','Coaching, Consulting & Therapy','coaching-consulting-therapy',5050,true),
  -- Education & Tutoring
  ('academic_tutoring','Academic tutoring','Education & Tutoring','education-tutoring',6010,true),
  ('language_instruction','Language instruction','Education & Tutoring','education-tutoring',6020,true),
  ('test_prep','Test prep','Education & Tutoring','education-tutoring',6030,true),
  -- Real Estate
  ('real_estate_agent','Real estate agent','Real Estate','real-estate',7010,true),
  ('real_estate_broker','Real estate broker','Real Estate','real-estate',7020,true),
  ('property_management','Property management','Real Estate','real-estate',7030,true),
  ('real_estate_investment','Real estate investment','Real Estate','real-estate',7040,true),
  -- General Contracting & Renovation
  ('general_contractor','General contractor','General Contracting & Renovation','general-contracting',8010,true),
  ('renovation','Renovation','General Contracting & Renovation','general-contracting',8020,true),
  ('remodeling','Remodeling','General Contracting & Renovation','general-contracting',8030,true),
  -- Outdoor & Recurring Trade Services
  ('landscaping','Landscaping','Outdoor & Recurring Trade Services','outdoor-trade-services',9010,true),
  ('pools','Pools','Outdoor & Recurring Trade Services','outdoor-trade-services',9020,true),
  ('cleaning_services','Cleaning services','Outdoor & Recurring Trade Services','outdoor-trade-services',9030,true),
  -- Medical & Dental Practices
  ('dentist','Dentist','Medical & Dental Practices','medical-dental',10010,true),
  ('dental_clinic','Dental clinic','Medical & Dental Practices','medical-dental',10020,true),
  ('physical_therapy','Physical therapy','Medical & Dental Practices','medical-dental',10030,true),
  ('chiropractic','Chiropractic','Medical & Dental Practices','medical-dental',10040,true),
  -- Fitness, Training & Movement
  ('fitness','Fitness','Fitness, Training & Movement','fitness-training',11010,true),
  ('personal_training','Personal training','Fitness, Training & Movement','fitness-training',11020,true),
  ('yoga','Yoga','Fitness, Training & Movement','fitness-training',11030,true),
  -- Other
  ('other_industry','Something else','Other',NULL,99999,true)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  group_label = EXCLUDED.group_label,
  group_slug = EXCLUDED.group_slug,
  sort_order = EXCLUDED.sort_order,
  is_active = true;