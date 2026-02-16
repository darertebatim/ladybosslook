
-- Allow users to INSERT/UPDATE their own subscriptions (client-side RevenueCat sync)
CREATE POLICY "Users can insert own subscription"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
