
-- Theme 1: Mindset, Vision & Your "Why"
WITH r1 AS (
  INSERT INTO public.reflections (title, subtitle, emoji, category, is_active, is_featured, is_free, shuffle_mode, sort_order)
  VALUES ('Mindset, Vision & Your "Why"', 'Connect to your deeper motivations and build resilience', '🧠', 'business-finance', true, false, false, false, 100)
  RETURNING id
)
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content, description) VALUES
  ((SELECT id FROM r1), 1, 'question', 'If fear and money were no object, what would your dream business look like? Describe a day in the life of you running that business.', 'Vision & Identity'),
  ((SELECT id FROM r1), 2, 'question', 'What is one belief you hold about your ability to make money or succeed in business that might be holding you back? Where did this belief come from?', 'Limiting Beliefs'),
  ((SELECT id FROM r1), 3, 'question', 'Beyond making money, what is the core reason you started (or want to start) your business? Who do you want to help?', 'Your Why'),
  ((SELECT id FROM r1), 4, 'question', 'What is one business ''win'' you''ve had in the last 7 days? No win is too small to celebrate. Write it down and feel the gratitude.', 'Celebrating Wins'),
  ((SELECT id FROM r1), 5, 'question', 'What are three qualities of a powerful, successful CEO you admire? How can you embody one of those qualities today?', 'CEO Identity');

-- Theme 2: Money & Abundance
WITH r2 AS (
  INSERT INTO public.reflections (title, subtitle, emoji, category, is_active, is_featured, is_free, shuffle_mode, sort_order)
  VALUES ('Money & Abundance', 'Explore your relationship with money and revenue-generating activities', '💰', 'business-finance', true, false, false, false, 101)
  RETURNING id
)
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content, description) VALUES
  ((SELECT id FROM r2), 1, 'question', 'What is your earliest memory of money? How does that memory influence how you run your business finances today?', 'Money Story'),
  ((SELECT id FROM r2), 2, 'question', 'What is the #1 most direct, money-making action you can take in your business today? What''s one small step to get it done?', 'Revenue Action'),
  ((SELECT id FROM r2), 3, 'question', 'Think about what you sell. What is the true transformation or value you provide? Does your pricing reflect that value? Why or why not?', 'Pricing & Value'),
  ((SELECT id FROM r2), 4, 'question', 'List three pieces of evidence that your business is abundant right now. (e.g., a client testimonial, a new follower, an idea, a finished task).', 'Abundance'),
  ((SELECT id FROM r2), 5, 'question', 'Let''s brainstorm. List 5 potential ways your business could generate income, even if they seem ''out there''. (e.g., new product, affiliate links, a workshop, a service).', 'Income Streams');

-- Theme 3: Strategy & Action
WITH r3 AS (
  INSERT INTO public.reflections (title, subtitle, emoji, category, is_active, is_featured, is_free, shuffle_mode, sort_order)
  VALUES ('Strategy & Action', 'Get out of your head and into practical, strategic execution', '🎯', 'business-finance', true, false, false, false, 102)
  RETURNING id
)
INSERT INTO public.reflection_pages (reflection_id, page_order, type, content, description) VALUES
  ((SELECT id FROM r3), 1, 'question', 'What is the ''one thing'' you could accomplish this week that would make everything else easier or unnecessary?', 'Focus & Priority'),
  ((SELECT id FROM r3), 2, 'question', 'Describe your absolute dream client in detail. Where do they hang out? What do they struggle with? How can you get in front of them this week?', 'Client Attraction'),
  ((SELECT id FROM r3), 3, 'question', 'Look at your business to-do list. What is one task you can A) Automate, B) Delegate, or C) Delete to free up your energy for more important work?', 'Productivity'),
  ((SELECT id FROM r3), 4, 'question', 'What is one skill that, if you mastered it, would dramatically grow your business? What''s a 15-minute action you can take today to start learning it?', 'Learning & Growth'),
  ((SELECT id FROM r3), 5, 'question', 'Looking back at the past week, what action created the most results? What action created the least? How can you use this knowledge to plan next week?', 'Weekly Review');
