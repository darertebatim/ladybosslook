-- Create wallets for all existing profiles
INSERT INTO public.user_wallets (user_id, credits_balance)
SELECT id, 0
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_wallets)
ON CONFLICT (user_id) DO NOTHING;