-- Insert the one-time full payment option for EWPLUS
INSERT INTO program_catalog (
  slug,
  title,
  type,
  payment_type,
  price_amount,
  original_price,
  description,
  is_active,
  available_on_web,
  available_on_mobile
) VALUES (
  'ewpluscoaching-full',
  'EWPLUS Coaching (Full Payment)',
  'group-coaching',
  'one-time',
  119400,
  179100,
  '۹ ماه کوچینگ پیشرفته برای رشد مستمر - پرداخت یکجا با ۳ ماه رایگان',
  true,
  true,
  false
);