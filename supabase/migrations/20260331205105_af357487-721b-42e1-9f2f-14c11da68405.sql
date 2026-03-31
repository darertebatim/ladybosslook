
-- Money Mindset Reflections
WITH r1 AS (
  INSERT INTO public.reflections (title, subtitle, emoji, category, is_active, is_featured, is_free, shuffle_mode, sort_order)
  VALUES ('Money Mindset Reflections', 'Build a loving, abundant, and resilient relationship with money and value', '🌱', 'business-finance', true, false, false, false, 103)
  RETURNING id
)
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content, description) VALUES
  ((SELECT id FROM r1), 1, 'question', 'What''s one story about money you learned as a child? How can you look at that memory with kindness and understanding today?', 'Childhood Story'),
  ((SELECT id FROM r1), 2, 'question', 'Describe the unique value you bring to your clients. Beyond the product or service, what is the wonderful *feeling* you give them?', 'The Feeling of Value'),
  ((SELECT id FROM r1), 3, 'question', 'If your business felt easy and joyful, what would that look like? Describe a perfect, flowing workday.', 'Abundant Flow'),
  ((SELECT id FROM r1), 4, 'question', 'What''s one small fear about money you''re holding onto? Let''s just acknowledge it here, without judgment. What does it need to feel safe?', 'Compassion for Fear'),
  ((SELECT id FROM r1), 5, 'question', 'List three things your money has provided for you this week, no matter how small (e.g., a warm drink, internet access, a comfy blanket).', 'Micro-Gratitude'),
  ((SELECT id FROM r1), 6, 'question', 'Let''s dream for a moment. If a surprise payment landed in your account today, what is the first joyful thing you would do for *yourself*?', 'Joyful Receiving'),
  ((SELECT id FROM r1), 7, 'question', 'Look back at the last month. What is one piece of evidence that your work is making a positive impact on someone?', 'Evidence of Worth'),
  ((SELECT id FROM r1), 8, 'question', 'What would it feel like to be truly open to receiving more? More clients, more money, more compliments. Just sit with that feeling for a moment.', 'Open to More');

-- CEO Wellness Reflections
WITH r2 AS (
  INSERT INTO public.reflections (title, subtitle, emoji, category, is_active, is_featured, is_free, shuffle_mode, sort_order)
  VALUES ('CEO Wellness Reflections', 'Honor your well-being as the most critical component of your business success', '🧘‍♀️', 'business-finance', true, false, false, false, 104)
  RETURNING id
)
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content, description) VALUES
  ((SELECT id FROM r2), 1, 'question', 'Pause and take a breath. Check in with your body right now. Where are you holding tension? What does your body need from you in this moment?', 'Body Check-in'),
  ((SELECT id FROM r2), 2, 'question', 'What does ''true rest'' feel like to you (it might be different from sleep)? How can you invite just one minute of that feeling into your day today?', 'Defining True Rest'),
  ((SELECT id FROM r2), 3, 'question', 'What is a ''win'' you had today that had nothing to do with money? (e.g., you held a boundary, took a real break, felt proud). Let''s celebrate it here.', 'The Non-Financial Win'),
  ((SELECT id FROM r2), 4, 'question', 'What is one simple, gentle boundary you can create today to protect your energy? (e.g., ''no phone for the first 15 mins of the day'').', 'Protecting Your Peace'),
  ((SELECT id FROM r2), 5, 'question', 'Think of a recent business challenge. How would you advise a dear friend going through the same thing? Now, write that same compassionate advice to yourself.', 'A Letter to a Friend'),
  ((SELECT id FROM r2), 6, 'question', 'What one activity in your business truly lights you up and gives you energy? How could you do a tiny bit more of that this week?', 'Energy Audit'),
  ((SELECT id FROM r2), 7, 'question', 'For today, what does ''enough'' look like? Acknowledging when you''ve done enough is a radical act of self-care. What is your ''enough'' point for today?', 'Your Enough Point'),
  ((SELECT id FROM r2), 8, 'question', 'Think about the effort you''ve put in today or this week, separate from the results. Write a sentence of praise for your own dedication and resilience.', 'Praise for the Process');
