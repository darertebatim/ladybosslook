-- Vida: purchase data sat on the never-used hosseini_vida@yahoo.com account
-- while she signs in with vidahosseinimarani49@gmail.com. Move data to the live account.
UPDATE public.course_enrollments SET user_id = '8718ffdf-d2c9-435e-9a81-dcb56726c049'
  WHERE user_id = 'b174967f-4b10-432f-9b78-eaf3d09422fc';
UPDATE public.orders SET user_id = '8718ffdf-d2c9-435e-9a81-dcb56726c049'
  WHERE user_id = 'b174967f-4b10-432f-9b78-eaf3d09422fc';
UPDATE public.user_subscriptions SET user_id = '8718ffdf-d2c9-435e-9a81-dcb56726c049'
  WHERE user_id = 'b174967f-4b10-432f-9b78-eaf3d09422fc';
UPDATE public.cart_items SET user_id = '8718ffdf-d2c9-435e-9a81-dcb56726c049'
  WHERE user_id = 'b174967f-4b10-432f-9b78-eaf3d09422fc';

-- Flip the alias so the live account is primary and the payment email is the alias
DELETE FROM public.account_email_aliases WHERE email = 'vidahosseinimarani49@gmail.com';
INSERT INTO public.account_email_aliases (email, primary_user_id, merged_from_user_id, merged_by)
VALUES ('hosseini_vida@yahoo.com', '8718ffdf-d2c9-435e-9a81-dcb56726c049', 'b174967f-4b10-432f-9b78-eaf3d09422fc', '037d7614-a7c4-4f42-a358-3b435c2dc1d9')
ON CONFLICT DO NOTHING;