
CREATE TABLE IF NOT EXISTS public.aperture_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.aperture_tools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_tools TO authenticated;
GRANT ALL ON public.aperture_tools TO service_role;
ALTER TABLE public.aperture_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aperture_tools_read" ON public.aperture_tools FOR SELECT USING (true);
CREATE POLICY "aperture_tools_admin_write" ON public.aperture_tools
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='tg_aperture_tools_updated') THEN
    CREATE TRIGGER tg_aperture_tools_updated
      BEFORE UPDATE ON public.aperture_tools
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

INSERT INTO public.aperture_industries (slug, label, group_label, sort_order, is_active) VALUES
  ('food_beverage','Food & beverage','Service & local',10,true),
  ('beauty_salon','Beauty / salon / spa','Service & local',20,true),
  ('fitness_wellness','Fitness & wellness','Service & local',30,true),
  ('home_services','Home services (cleaning, repair)','Service & local',40,true),
  ('professional_services','Professional services (legal, accounting)','Service & local',50,true),
  ('healthcare','Healthcare & clinic','Service & local',60,true),
  ('real_estate','Real estate','Service & local',70,true),
  ('education_tutoring','Education / tutoring','Service & local',80,true),
  ('ecommerce_physical','E-commerce — physical product','Product & retail',110,true),
  ('handmade_crafts','Handmade / crafts','Product & retail',120,true),
  ('fashion_apparel','Fashion / apparel','Product & retail',130,true),
  ('jewelry','Jewelry & accessories','Product & retail',140,true),
  ('beauty_brand','Beauty / cosmetics brand','Product & retail',150,true),
  ('home_goods','Home goods & decor','Product & retail',160,true),
  ('food_brand','Packaged food / beverage brand','Product & retail',170,true),
  ('coach_consultant','Coach / consultant','Creator & expert',210,true),
  ('course_creator','Course creator / educator','Creator & expert',220,true),
  ('content_creator','Content creator / influencer','Creator & expert',230,true),
  ('author_speaker','Author / speaker','Creator & expert',240,true),
  ('podcaster','Podcaster','Creator & expert',250,true),
  ('saas_software','SaaS / software','Tech & digital',310,true),
  ('agency_marketing','Marketing / creative agency','Tech & digital',320,true),
  ('freelance_design','Freelance design / dev','Tech & digital',330,true),
  ('ai_automation','AI / automation services','Tech & digital',340,true),
  ('events_hospitality','Events / hospitality','Other',410,true),
  ('nonprofit','Nonprofit / community','Other',420,true),
  ('membership_community','Membership / community','Other',430,true),
  ('other','Something else','Other',490,true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.aperture_tools (slug, label, category, sort_order, is_active) VALUES
  ('shopify','Shopify','E-commerce',10,true),
  ('woocommerce','WooCommerce','E-commerce',20,true),
  ('etsy','Etsy','E-commerce',30,true),
  ('amazon','Amazon Seller','E-commerce',40,true),
  ('stripe','Stripe','Payments',110,true),
  ('paypal','PayPal','Payments',120,true),
  ('square','Square','Payments',130,true),
  ('quickbooks','QuickBooks','Accounting',210,true),
  ('xero','Xero','Accounting',220,true),
  ('wave','Wave','Accounting',230,true),
  ('instagram','Instagram','Marketing & social',310,true),
  ('tiktok','TikTok','Marketing & social',320,true),
  ('facebook','Facebook','Marketing & social',330,true),
  ('youtube','YouTube','Marketing & social',340,true),
  ('pinterest','Pinterest','Marketing & social',350,true),
  ('linkedin','LinkedIn','Marketing & social',360,true),
  ('mailchimp','Mailchimp','Email & CRM',410,true),
  ('klaviyo','Klaviyo','Email & CRM',420,true),
  ('convertkit','ConvertKit','Email & CRM',430,true),
  ('hubspot','HubSpot','Email & CRM',440,true),
  ('canva','Canva','Design',510,true),
  ('figma','Figma','Design',520,true),
  ('adobe','Adobe Creative Cloud','Design',530,true),
  ('notion','Notion','Productivity',610,true),
  ('google_workspace','Google Workspace','Productivity',620,true),
  ('microsoft365','Microsoft 365','Productivity',630,true),
  ('slack','Slack','Productivity',640,true),
  ('trello','Trello','Productivity',650,true),
  ('asana','Asana','Productivity',660,true),
  ('zoom','Zoom','Productivity',670,true),
  ('chatgpt','ChatGPT','AI',710,true),
  ('claude','Claude','AI',720,true),
  ('midjourney','Midjourney','AI',730,true),
  ('calendly','Calendly','Scheduling',810,true),
  ('acuity','Acuity Scheduling','Scheduling',820,true)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.aperture_onboarding_questions
SET question_key = 'industry'
WHERE question_key = 'q11_industry';

INSERT INTO public.aperture_onboarding_questions
  (flow, step, question_key, prompt, hint, input_kind, options, bucket_slugs, section, sort_order, is_active)
SELECT
  'quick', 3, 'tools_used',
  'Which tools do you use to run the business?',
  'Pick everything you actively use. We will tailor advice to your stack.',
  'multi_choice', '[]'::jsonb, ARRAY['tools']::text[], 'Your stack', 90, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.aperture_onboarding_questions WHERE question_key='tools_used'
);
