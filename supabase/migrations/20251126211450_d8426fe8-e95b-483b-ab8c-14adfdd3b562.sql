-- Import refunded Courageous Character Course payments from Stripe
INSERT INTO orders (
  email,
  name,
  amount,
  product_name,
  status,
  refunded,
  refund_amount,
  currency,
  created_at,
  refunded_at,
  program_slug
) VALUES
  ('kimiajafar@live.com', 'Kimia Jafar', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-13 19:30:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('m.shamso@yahoo.com', 'Maryam Shams', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-13 18:45:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('parisa.torabi73@yahoo.com', 'Parisa Torabi', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-13 17:20:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('sara.shirazian@gmail.com', 'Sara Shirazian', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-13 16:30:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('laleh.khodaverdi@gmail.com', 'Laleh Khodaverdi', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-12 20:15:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('nasrinmokhtarmanesh@gmail.com', 'Nasrin Mokhtarmanesh', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-12 19:00:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('marjaneh.khosh@gmail.com', 'Marjaneh Khoshnevis', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-12 15:30:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('shadi.salari@outlook.com', 'Shadi Salari', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-11 21:45:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course'),
  ('baharehdalir@gmail.com', 'Bahareh Dalir', 9700, 'Courageous Character Course', 'refunded', true, 9700, 'usd', '2025-10-11 18:20:00+00', '2025-10-14 10:00:00+00', 'courageous-character-course')
ON CONFLICT (id) DO NOTHING;