
-- Fix overly permissive policy - drop and recreate scoped to service_role
DROP POLICY "Service can manage subscriptions" ON public.user_subscriptions;

-- Webhooks use service_role key, so allow inserts/updates for service_role
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
