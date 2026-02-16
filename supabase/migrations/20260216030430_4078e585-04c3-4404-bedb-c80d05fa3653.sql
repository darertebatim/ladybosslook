
-- Insert subscription for darertebatim@gmail.com to activate simora+
INSERT INTO public.user_subscriptions (user_id, program_slug, status, platform)
VALUES ('037d7614-a7c4-4f42-a358-3b435c2dc1d9', 'simora-plus', 'active', 'web')
ON CONFLICT (user_id, program_slug) DO UPDATE SET status = 'active', updated_at = now();

-- Also insert for alotlotfi@gmail.com (sandbox purchase user)
INSERT INTO public.user_subscriptions (user_id, program_slug, status, platform)
SELECT p.id, 'simora-plus', 'active', 'ios'
FROM profiles p WHERE p.email = 'alotlotfi@gmail.com'
ON CONFLICT (user_id, program_slug) DO UPDATE SET status = 'active', updated_at = now();
