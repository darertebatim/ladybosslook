
ALTER TABLE public.aperture_onboarding_questions DROP CONSTRAINT IF EXISTS aperture_onboarding_questions_input_kind_check;
ALTER TABLE public.aperture_onboarding_questions
  ADD CONSTRAINT aperture_onboarding_questions_input_kind_check
  CHECK (input_kind IN ('text','textarea','single_choice','multi_choice','short_text','long_text','email','url','industry_picker'));

ALTER TABLE public.aperture_onboarding_questions DROP CONSTRAINT IF EXISTS aperture_onboarding_questions_flow_check;
ALTER TABLE public.aperture_onboarding_questions
  ADD CONSTRAINT aperture_onboarding_questions_flow_check
  CHECK (flow IN ('quick','full','essential'));

ALTER TABLE public.aperture_memory_items
  ADD COLUMN IF NOT EXISTS layer text,
  ADD COLUMN IF NOT EXISTS bucket_half text,
  ADD COLUMN IF NOT EXISTS wave_number int;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aperture_memory_items_layer_check') THEN
    ALTER TABLE public.aperture_memory_items
      ADD CONSTRAINT aperture_memory_items_layer_check
      CHECK (layer IS NULL OR layer IN ('revenue_engine','owner_capacity','financial_health','direction'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.aperture_bucket_half_valid(_bucket text, _half text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _half IS NULL THEN true
    WHEN _bucket = 'customers' AND _half IN ('icp','existing') THEN true
    WHEN _bucket = 'money'     AND _half IN ('revenue','cost')  THEN true
    WHEN _bucket = 'products'  AND _half IN ('front','back')    THEN true
    WHEN _bucket = 'partners'  AND _half IN ('referrals','suppliers','delivery') THEN true
    ELSE false
  END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'aperture_memory_items_bucket_half_check') THEN
    ALTER TABLE public.aperture_memory_items
      ADD CONSTRAINT aperture_memory_items_bucket_half_check
      CHECK (public.aperture_bucket_half_valid(bucket_slug, bucket_half));
  END IF;
END $$;

ALTER TABLE public.aperture_user_profile
  ADD COLUMN IF NOT EXISTS essential_onboarded_at timestamptz;

ALTER TABLE public.aperture_onboarding_questions
  ADD COLUMN IF NOT EXISTS signal_key text;

UPDATE public.aperture_onboarding_questions
   SET is_active = false, updated_at = now()
 WHERE flow IN ('quick','full') AND is_active = true;

CREATE TABLE IF NOT EXISTS public.aperture_waves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wave_number int NOT NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','in_progress','complete','skipped')),
  active_layers text[] DEFAULT '{}',
  reasoning_summary text,
  question_payload jsonb,
  answered_count int NOT NULL DEFAULT 0,
  selected_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, wave_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_waves TO authenticated;
GRANT ALL ON public.aperture_waves TO service_role;

ALTER TABLE public.aperture_waves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waves_owner_read" ON public.aperture_waves;
DROP POLICY IF EXISTS "waves_owner_insert" ON public.aperture_waves;
DROP POLICY IF EXISTS "waves_owner_update" ON public.aperture_waves;
DROP POLICY IF EXISTS "waves_owner_delete" ON public.aperture_waves;
CREATE POLICY "waves_owner_read"   ON public.aperture_waves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "waves_owner_insert" ON public.aperture_waves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "waves_owner_update" ON public.aperture_waves FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "waves_owner_delete" ON public.aperture_waves FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_aperture_waves_updated_at ON public.aperture_waves;
CREATE TRIGGER trg_aperture_waves_updated_at
BEFORE UPDATE ON public.aperture_waves
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DELETE FROM public.aperture_onboarding_questions WHERE flow = 'essential';

INSERT INTO public.aperture_onboarding_questions
  (flow, step, question_key, prompt, hint, input_kind, options, bucket_slugs, section, sort_order, is_active, signal_key)
VALUES
('essential', 1, 'owner_name',    'What''s your name?',            NULL, 'short_text', '[]'::jsonb, ARRAY['basics']::text[], 'phase1_identifiers', 10, true, NULL),
('essential', 1, 'business_name', 'What''s your business called?', NULL, 'short_text', '[]'::jsonb, ARRAY['basics']::text[], 'phase1_identifiers', 20, true, NULL),
('essential', 2, 'industry',                   'Which industry are you in?', 'Pick the closest fit — we''ll tailor everything to it.', 'industry_picker', '[]'::jsonb, ARRAY['basics']::text[], 'phase2_core',  30, true, 'Q1'),
('essential', 2, 'business_age',               'How long have you been running this business?', NULL, 'single_choice',
  '["Just started","Less than 1 year","Between 1 and 3 years","Between 3 and 7 years","More than 7 years"]'::jsonb, ARRAY['basics']::text[], 'phase2_core', 40, true, 'Q2'),
('essential', 2, 'team_size',                  'How many people work in your business including yourself?', NULL, 'single_choice',
  '["Just me — I work alone","2 to 5 people","6 to 10 people","More than 10 people"]'::jsonb, ARRAY['team']::text[], 'phase2_core', 50, true, 'Q3'),
('essential', 2, 'help_area',                  'What area do you most need help with right now?', NULL, 'single_choice',
  '["Sales — getting more clients or customers","Marketing — being found and known","Finance — managing money, profit, or funding","Hiring — finding and keeping the right people","Operations — organizing and running the business better","Strategy — knowing what to focus on and what to do next"]'::jsonb, ARRAY['vision']::text[], 'phase2_core', 60, true, 'Q4'),
('essential', 2, 'monthly_revenue',            'What is your average monthly revenue right now?', NULL, 'single_choice',
  '["Less than $5,000","Between $5,000 and $15,000","Between $15,000 and $50,000","Between $50,000 and $100,000","More than $100,000","I don''t track it consistently — I''m not sure"]'::jsonb, ARRAY['money']::text[], 'phase2_core', 70, true, 'Q5'),
('essential', 2, 'revenue_shape',              'When you think honestly about your revenue — what best describes it?', NULL, 'single_choice',
  '["It''s growing steadily and I feel good about the direction","It''s been flat for a while — same number month after month","It goes up and down — very inconsistent","It''s lower than it should be for the time and effort I put in","It''s growing but I''m not making enough profit despite the revenue"]'::jsonb, ARRAY['money']::text[], 'phase2_core', 80, true, 'Q6'),
('essential', 2, 'revenue_source',             'Where does most of your revenue come from?', NULL, 'single_choice',
  '["Repeat clients or customers who keep coming back","New clients every time — I''m always finding new people","One or two main clients that make up most of my income","Walk-in or online traffic — people who find me on their own","Referrals from people I know — word of mouth almost entirely"]'::jsonb, ARRAY['sales','customers']::text[], 'phase2_core', 90, true, 'Q7'),
('essential', 2, 'product_count',              'How many products or services do you sell?', NULL, 'single_choice',
  '["Just one","2–5","6–10","More than 10"]'::jsonb, ARRAY['products']::text[], 'phase2_core', 100, true, 'Q8'),
('essential', 2, 'time_focus',                 'On a typical workday, what does most of your time go toward?', NULL, 'single_choice',
  '["Delivering the service or product — doing the actual work","Finding and talking to new clients or customers","Managing operations, admin, and logistics","Managing a team or employees","A mix of everything — I do it all"]'::jsonb, ARRAY['operations']::text[], 'phase2_core', 110, true, 'Q9'),
('essential', 2, 'client_acquisition_channel', 'What has been your main way of getting new clients or customers in the last 6 months?', NULL, 'single_choice',
  '["Social media — Instagram, Facebook, TikTok","Word of mouth — people recommending me","My existing network — people I already know","Paid ads — Meta, Google, or other platforms","I haven''t been actively trying — clients come when they come","I''ve been struggling to get new clients consistently"]'::jsonb, ARRAY['marketing']::text[], 'phase2_core', 120, true, 'Q10'),
('essential', 2, 'ig_follower_source',         'How did you get most of your followers on Instagram?', NULL, 'single_choice',
  '["Organic — posting content regularly","Collaborating with influencers or other accounts","Boosting posts or running Meta ads","Mostly friends and family","I haven''t really tried to grow it"]'::jsonb, ARRAY['content','marketing']::text[], 'phase2_core', 130, true, 'Q11'),
('essential', 2, 'ig_client_conversion',       'Are you getting clients or customers from Instagram?', NULL, 'single_choice',
  '["Yes — it''s one of my main sources","Sometimes — but not consistently","Rarely — I post but it doesn''t convert","No — I don''t use it for business"]'::jsonb, ARRAY['marketing']::text[], 'phase2_core', 140, true, 'Q12'),
('essential', 2, 'ig_future_role',             'How do you see Instagram in your business going forward?', NULL, 'single_choice',
  '["Big priority — I want to grow it seriously","Useful but not my main focus","Not sure — I haven''t seen real results yet","Not relevant for my type of business"]'::jsonb, ARRAY['marketing','content']::text[], 'phase2_core', 150, true, 'Q13'),
('essential', 2, 'customer_type',              'Who are most of your customers?', NULL, 'single_choice',
  '["People from my own community — cultural, ethnic, or religious network","A general mix — all kinds of people","Local people who find me nearby or online","Mostly businesses, not individual people"]'::jsonb, ARRAY['customers']::text[], 'phase2_core', 160, true, 'Q14'),
('essential', 2, 'customer_alignment',         'Is that who you actually want to be serving?', NULL, 'single_choice',
  '["Yes — I''m reaching exactly who I want","Not quite — I have an ideal customer in mind but I''m not fully reaching them yet","No — I want to reach a completely different type of customer","I haven''t really thought about it"]'::jsonb, ARRAY['customers']::text[], 'phase2_core', 170, true, 'Q15'),
('essential', 2, 'growth_blocker',             'What do you think is the main thing limiting your growth right now?', NULL, 'single_choice',
  '["I don''t have enough clients or customers","I don''t have enough time — I''m already at capacity","I don''t have enough money to invest in growth","I don''t have the right team or people around me","I don''t have a clear strategy — I''m not sure what to focus on","My pricing is too low but I''m afraid to raise it"]'::jsonb, ARRAY['vision']::text[], 'phase2_core', 180, true, 'Q16'),
('essential', 2, 'two_year_win',               'When you imagine your business two years from now — what does the win look like?', NULL, 'single_choice',
  '["More revenue and profit — same business, bigger numbers","A business that runs without me being in it every day","A recognizable brand with a real market presence","Expanded — more locations, more services, more markets","I haven''t thought that far ahead — I''m focused on surviving right now"]'::jsonb, ARRAY['vision']::text[], 'phase2_core', 190, true, 'Q17'),
('essential', 2, 'building_toward',            'What are you actually building toward?', NULL, 'single_choice',
  '["I need this to generate significantly more income as soon as possible — I can''t wait long","I want something stable that gives me real financial freedom within a year or two","I''m building for the long term — I want something that grows and compounds over time","I''m not sure yet — I just know I want to be working for myself and not depending on anyone"]'::jsonb, ARRAY['vision']::text[], 'phase2_core', 200, true, 'Q18'),
('essential', 2, 'investment_priority',        'If someone handed you $20,000 for your business today — where would it go?', NULL, 'single_choice',
  '["Marketing and ads — I need more people to find me","Hiring someone — I can''t keep doing everything myself","Inventory, equipment, or upgrading what I already have","Paying down debt or getting the business on stable ground first","I''d save it — I''m not sure yet what the right investment is","Honestly I''m not sure — that''s part of the problem"]'::jsonb, ARRAY['money','vision']::text[], 'phase2_core', 210, true, 'Q19'),
('essential', 2, 'monthly_profit',             'What is your average monthly profit after all expenses?', NULL, 'single_choice',
  '["I''m not sure — I don''t separate revenue from profit clearly","I''m barely breaking even or sometimes losing money","Between $1,000 and $5,000","Between $5,000 and $15,000","Between $15,000 and $50,000","More than $50,000"]'::jsonb, ARRAY['money']::text[], 'phase2_core', 220, true, 'Q20'),
('essential', 2, 'ai_tool_used',               'Which AI tool do you use the most?', NULL, 'single_choice',
  '["ChatGPT","Claude","Gemini","Grok","Other","I don''t use AI tools"]'::jsonb, ARRAY['tools']::text[], 'phase2_core', 230, true, 'Q21'),
('essential', 3, 'instagram', 'What''s your Instagram handle?', 'Optional — I''ll use it to research your business.', 'short_text', '[]'::jsonb, ARRAY['marketing']::text[], 'phase3_research', 240, true, NULL),
('essential', 3, 'website',   'What''s your website?',           'Optional — I''ll fetch and summarize it.',           'url',        '[]'::jsonb, ARRAY['basics']::text[],    'phase3_research', 250, true, NULL),
('essential', 4, 'phone',    'What''s your phone number?', NULL, 'short_text', '[]'::jsonb, ARRAY['basics']::text[], 'phase4_contact', 260, true, NULL),
('essential', 4, 'email',    'What''s your email?',        NULL, 'email',      '[]'::jsonb, ARRAY['basics']::text[], 'phase4_contact', 270, true, NULL),
('essential', 4, 'location', 'Where''s your business located?', 'City / region.', 'short_text', '[]'::jsonb, ARRAY['basics']::text[], 'phase4_contact', 280, true, NULL),
('essential', 5, 'closing_help',
  'How can I help you most right now?',
  'If I could take one thing off your plate starting today — what would it be?',
  'long_text', '[]'::jsonb, ARRAY['__notes__']::text[], 'phase5_closing', 290, true, NULL);
