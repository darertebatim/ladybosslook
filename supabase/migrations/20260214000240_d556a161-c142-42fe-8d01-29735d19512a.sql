
-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'trial', 'cancelled');

-- Create subscription_products table
CREATE TABLE public.subscription_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ios_product_id TEXT,
  stripe_price_id TEXT,
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly')),
  price_amount INTEGER NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products" ON public.subscription_products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON public.subscription_products
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('ios', 'web', 'stripe')),
  product_id UUID REFERENCES public.subscription_products(id),
  expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  revenuecat_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Service role inserts/updates (for webhooks via service role key)
CREATE POLICY "Service can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create tool_access_config table
CREATE TABLE public.tool_access_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id TEXT NOT NULL UNIQUE,
  requires_subscription BOOLEAN NOT NULL DEFAULT false,
  free_usage_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_access_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tool config" ON public.tool_access_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tool config" ON public.tool_access_config
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tool_access_config_updated_at
  BEFORE UPDATE ON public.tool_access_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default tool configs
INSERT INTO public.tool_access_config (tool_id, requires_subscription) VALUES
  ('journal', false),
  ('breathe', false),
  ('water', false),
  ('mood', false),
  ('fasting', false),
  ('period', false),
  ('planner', false);

-- Add requires_subscription to existing tables
ALTER TABLE public.audio_playlists ADD COLUMN requires_subscription BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.program_catalog ADD COLUMN requires_subscription BOOLEAN NOT NULL DEFAULT false;

-- Check if routines_bank exists and add column
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'routines_bank') THEN
    EXECUTE 'ALTER TABLE public.routines_bank ADD COLUMN requires_subscription BOOLEAN NOT NULL DEFAULT false';
  END IF;
END $$;
