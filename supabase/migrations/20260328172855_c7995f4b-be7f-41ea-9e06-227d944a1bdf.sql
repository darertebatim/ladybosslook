DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Meal Time', 'What did you enjoy most from today''s meals?', 'morning', 22, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What would you rate your meals today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one quality you can appreciate from today''s meal?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What made a meal today unique?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'How did you feel before and after a meal today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What stood out most from your meals today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What did you enjoy most from today''s meals?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What can you appreciate from today''s meals?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Describe in detail how a meal from today tasted.');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Confidence Booster', 'What would you do if you were more confident?', 'morning', 23, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Who makes you feel more confident?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Name one issue, big or small, that you think you can contribute to.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What''s something that drives you each day?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one quality about yourself that you respect?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Who is one person you can make smile today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What is one small thing you can do today to live closer to your values?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Gratitude Jar', 'What recent moment are you thankful for?', 'morning', 24, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Who helps energize you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one item that you own that you''re grateful for?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What would you say are the best things about where you live?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What''s one thing that makes your life easier?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is one meaningful gift you received?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Has there ever been a time when you thought "It doesn''t get any better than this?"');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Who makes your life easier?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Affirmation of the Day', 'Write an affirmation to set a positive tone!', 'morning', 25, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Write an affirmation for yourself today.');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Happiness Magnifier', 'What made you happy today?', 'morning', 26, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What do you expect to enjoy the most today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Dream Diary', 'Did you recall multiple dreams?', 'morning', 27, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Were the emotions in your dream similar to your emotions from yesterday?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Are there any recurring themes in your dreams?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Did you recall multiple dreams?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Who appears most often in your dreams?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What facts were you aware of about your dream last night?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What do you think your last night dream might mean?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What stood out the most in your dream?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What did you dream about last night?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Describe your dream in vivid details.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What emotion felt strongest in your dream?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'How did your dream emotionally impact you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 11, 'question', 'Was there anything unusual about your dream last night?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 12, 'question', 'What happened in your dream last night?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Your Inner Voice', 'What is one book that means a lot to you?', 'morning', 28, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one book that means a lot to you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'When was the first time you''ve said I love you to someone? Did you mean it?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is one useful coping mechanism you''ve relied on when times were tough?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one event that strongly impacts who you are today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is one of your most treasured relationships?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What is something creative you made that you''re proud of?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What is one item you consider irreplaceable?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What''s one moment with a loved one when shyness caused you to hesitate?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Who do you want to be closer to?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What does resilience mean to you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'What is one lie you recently told someone, big or small?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 11, 'question', 'What is the hardest decision you have ever made?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 12, 'question', 'What''s the most valuable thing your parents taught you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 13, 'question', 'How do you treat people who can do nothing for you?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Growth Mindset', 'What is one quality about yourself that can make you difficult to live with?', 'morning', 29, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one quality about yourself that can make you difficult to live with?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one small mistake I repeatedly make? What can I do differently?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'In what way could you be more mature?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Who is one person you''d want to forgive? Why?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is one area I know I can improve in.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Who is one person you under appreciate?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Recall a moment you didn''t speak up but you know you should have?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What is one opinion you''re glad you no longer hold?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What is one thing you regret?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'Who is one person you wished you could apologize to? What happened?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'What often hurts your decision-making process?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 11, 'question', 'What is one thing your ego has kept you from doing?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Childhood', 'What is one thing you hid from your parents as a child?', 'morning', 30, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one thing you hid from your parents as a child?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What did you think of adults as a child?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Have you ever been caught red-handed as a kid doing something you weren''t supposed to be doing?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one memorable memory you have from your childhood?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What childhood memory do you have when you felt lonely?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Are you more emotionally open or closed as a child?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'If you could time travel, what would you tell your childhood self?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What was your childhood nickname?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What is one thing you wish you could restore from your childhood?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'Describe a moment you were emotionally open as a child.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'What is one prejudice you had as a child?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Teen Years', 'Describe a moment you felt lonely in your teens.', 'morning', 31, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Describe a moment you felt lonely in your teens.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What physical features did others comment on the most when you were a teenager?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Describe a memory you didn''t want to do what your parents wanted?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Are you more emotionally open or closed as a teenager?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What smell reminds you the most of your teen years?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What was an embarrassing moment you had as a teenager?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What did you enjoy most doing as a teenager? Do you get those feelings now?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What was in your high school locker?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Describe a moment you were emotionally closed as a teenager.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What was your nickname in your teenage years?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'What is one TV show that meant a lot to you as a teen?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Affection Practice', 'What''s something that makes you feel safe?', 'energize', 32, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Who do you look forward to spending time with today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one admirable quality about one of your friends?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is something about a friend that you wished you didn''t take for granted?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one quality about your parents that you appreciate?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Write about your family you can admire.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Who makes you feel most safe?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Write about a friend that you appreciate.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Write about a family member you''re grateful for.');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Fun Times', 'Describe a time you made someone laugh uncontrollably.', 'energize', 33, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What made you laugh today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Describe a time you made someone laugh uncontrollably.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What made you laugh recently?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Who made you laugh recently?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What''s a funny moment that warms you up?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What''s one thing that used to make you laugh?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What was the funniest moment this past week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Describe in detail a funny moment to relive.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Who made you laugh today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Honest Reviews', 'What are you reviewing and what did you think of it?', 'calm', 34, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What are you reviewing and what did you think of it?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('First Impressions', 'What was the new experience and how did it feel?', 'calm', 35, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What was the new experience and how did it feel?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Work Cooldown', 'What is one hope you can aim for at work?', 'calm', 36, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What made you smile at work?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'How did today compare to last week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is one thing in your control from work?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What are some lingering thoughts from work?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'How do you feel about work today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'If your friend had your current thoughts on work, what would they say?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What is one hope you can aim for at work?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Feel Better', 'What made you most excited today?', 'calm', 37, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one reliable source of energy for you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one small new thing you can try later this week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What''s something that you''re looking forward to?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What about today can you get excited about?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Who is one reliable source of energy for you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What did you wish you were more confident in? Why?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What made you most excited today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Moment of Vulnerability', 'What made you feel uncertain today?', 'calm', 38, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What do you expect to happen today that could make you unhappy?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What are you unexcited about?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What do you think will drain your energy today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What made you feel uncertain today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Regroup Time', 'What made you unhappy today?', 'calm', 39, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What made you unhappy today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Rant Zone', 'What''s bothering you today?', 'calm', 40, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What''s bothering you today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Thoughts Dump', 'What''s on your mind?', 'calm', 41, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What''s on your mind?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Night Reflection', 'What''s on your mind?', 'night', 42, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'How is the day so far?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is influencing your motivation?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What''s one thing you''d like to do well today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is impacting your energy for today?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Today I Learned', 'What''s something new you learned recently?', 'night', 43, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What''s something you know now that you didn''t know last week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What''s something you know now that you didn''t know last year?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What''s your favorite thing you learned this week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What''s a fun fact you learned today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What learning surprised you today?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What''s something you know now that you didn''t know last month?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Giving Kindness', 'Who is a stranger that is hard to be kind to? Why?', 'night', 44, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Who is a stranger that is hard to be kind to? Why?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Appreciating Kindness of Others', 'Describe a moment when a friend was kind to you.', 'night', 45, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Describe a moment when a friend was kind to you.');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Value of Kindness', 'How should someone feel after they are kind to someone else?', 'night', 46, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'How should someone feel after they are kind to someone else?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Weekly Look Forward', 'What is one thing you can do to be more kind to your body next week?', 'big-picture', 47, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'If your next week was a picture, what would it look like?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one thing you can do to be more kind to yourself next week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is one thing you can do to be less hard on yourself next week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What does an ideal next week look like to you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What do you hope next week will be like?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What''s one thing in your control to make next week more energizing?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Who would you like to spend time with next week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What''s one thing in your control to make next week better?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What do you expect next week to be like?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What is one thing you can do to be more kind to your body next week?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Yearly Lookback', 'What was most memorable about the past year?', 'big-picture', 48, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What''s one small win you can do next year to be proud of?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What''s one thing in your control to make next year better?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'If you traveled one year in the future, what would you say to Future You?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one thing you can look forward to next year?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What''s one thing in your control to make next year more energizing?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What does an ideal next year look like to you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What do you expect next year to be like?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Romantic Partners', 'What is something you used to want from a relationship?', 'big-picture', 49, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is something you used to want from a relationship?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Describe one way your relationships have made you stronger.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Do you believe in love at first sight?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Is there anything you would never be willing to give up in a relationship?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Do you consider yourself worthy of love?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Describe a time you resolved an argument with a partner.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What is one thing you''ve learned about yourself from a past partner?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What is one thing you do to show your partner that you care?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What is the most embarrassing thing you''ve done on a date?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'Describe 3 ideal qualities in a partner.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'What part of yourself did you lose in your last relationship?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 11, 'question', 'Is it important to you to be in a relationship? Why or why not?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Friendships', 'What is one sign that could mean you could be friends for life?', 'big-picture', 50, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one sign that could mean you could be friends for life?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Describe the happiest memory with one of your best friends.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'How has your opinion of a friend changed over time?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is an embarrassing thing you had to do with a friend?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Can a friend truly be like family?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'If my friend was a piece of furniture, they''d be...');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Who is one friend you deeply respect? Why?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What is one quality you don''t share with a friend?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Describe a time you overcame an argument with a friend.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'Which of your friends on social media would you enjoy spending time with the most?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'Describe a time when a friend called me out on something.');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Living to the Fullest', 'Rank in order of importance for your work life: status, social impact, money, colleagues, creativity.', 'big-picture', 51, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Rank in order of importance for your work life: status, social impact, money, colleagues, creativity.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'How do you know when your life is going in the right direction?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is one value that is important to you?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one thing you''d try if you couldn''t fail?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is one dream you wish you didn''t give up on?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Where would you want to be 5 years from now?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What is one thing you need to remind yourself when you feel lost?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Where would you like to be 10 years from now?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'How would you change the way you lived if you didn''t care about other people''s opinions?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'How would you describe the best version of yourself?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'When do you feel most like yourself?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Hypothetical Scenarios', 'If you were invisible, what is the first thing you would do?', 'big-picture', 52, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'If you were invisible, what is the first thing you would do?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Would you rather be the richest person in the world or have the love of your life?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'If you had to show a tourist one place where you lived, where would you take them?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'If you were invisible for a week, what would you do?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'If you could see into the future, how far ahead would you want to see?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'If you had a time machine, would you rather travel to the future or to the past?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'If you had to choose a different first name, what would you go by?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Would you rather lose all your memories from the past or lose the ability to form new memories?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'If you were a tree and could be planted anywhere, where would you choose?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'If you could be anywhere in the world right now, where would you choose to be?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Opinions', 'What is one quality that makes a great leader?', 'big-picture', 53, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What is one quality that makes a great leader?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'If you could pass one law that everyone would have to follow, what would it be?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Which hobby is underrated?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Is it okay to laugh during dark times?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is likely the most common thing that couples fight about?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Do genius and madness go hand in hand?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Do you think that email will ever completely replace normal mail?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What is one animal that shouldn''t exist in real life?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'Can you name one good thing about the American way of life?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Past Romances', 'Have you ever had your heart broken?', 'big-picture', 54, true, false, true, false)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Have you ever had your heart broken?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Perspective', 'What two things would you take if your house were on fire?', 'big-picture', 55, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'What two things would you take if your house were on fire?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Who are the people you surround yourself with?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Are you glad to be living in the modern day and age, or do you wish you''d lived during a past era?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'If you had enough money to retire tomorrow, what would you do for the rest of your life?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Did you pause to celebrate the last time you accomplished a goal, big or small?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Do you think the best time in your life is in the past, present or future?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Family', 'In what way are you similar to a grandparent?', 'big-picture', 56, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'In what way are you similar to a grandparent?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Do you know how both sets of your grandparents met?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What is one thing your family has that other families may not have?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What can you appreciate about your family?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Does your family have a lot of inside jokes?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Which deceased relative do you miss the most?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What is one thing frustrating about your family but it comes from good intentions?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Parenting', 'How can a child learn to think from different perspectives?', 'big-picture', 57, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'How can a child learn to think from different perspectives?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'How can you help a child be curious about the world?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'How can a parent teach a child the values of hard work?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'How can you help a child enjoy reading?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What would you do if you found your child was being bullied at school?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Is pretending that Santa Claus is real lying to your children?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'At what age should a child be allowed to have a cellphone?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'How can a child learn to appreciate their own uniqueness?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'How important is it for a child to participate in athletics?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What name would you never give your child?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'Can good parenting be learned, or is it innate?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Spending Habits', 'How much did you spend on non-essentials this week?', 'big-picture', 58, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'How much did you spend on non-essentials this week?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Who is most influential on your spending habits?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'How similar are your spending habits from your parents''?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Is there any value in buying paper dictionaries anymore?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What emotions do you typically have a few days after you purchase an item?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'How can you reward yourself for saving some money each month?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Not counting a house or car, what is the most expensive thing you''ve ever bought?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Which things did you purchase recently that you TRULY need?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What''s the difference between being poor and being broke?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'What was the best $100 you ever spent?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Memory Lane', 'Did you ever have a really bad haircut or hairstyle? What did it look like?', 'big-picture', 59, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Did you ever have a really bad haircut or hairstyle? What did it look like?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Have you ever fallen asleep during something important?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Complete the sentence: I have never in my life been so angry as when...');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Can you think of a time when you were really in the right place at the right time?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is the most scenic landscape you''ve ever traveled through?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Have you ever had a really strange or memorable neighbor or roommate?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Describe a time when you did something truly kind for another person.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What''s the best party you''ve ever gone to?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What is your earliest memory?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 9, 'question', 'Describe a time you did something reckless and daring.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 10, 'question', 'Who is the most interesting person you have ever met?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Deep Thoughts', 'Is there anything that should never be joked about? Why or why not?', 'big-picture', 60, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Is there anything that should never be joked about? Why or why not?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'How would you define intelligence?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'Is happiness a choice? Why or why not?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Are people innately kind or selfish?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What invention has had the greatest impact on human culture and civilization?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What do you think the purpose of life is?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Do you think people ever really change?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Life Values', 'Is it okay to lie to avoid hurting someone''s feelings?', 'big-picture', 61, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Is it okay to lie to avoid hurting someone''s feelings?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'Who do I admire? Why?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'What motivates me to get out of bed in the morning?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'Is vulnerability a weakness or a strength?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'What is one thing that makes me feel fulfilled?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'Is it okay to have irrational phobias? Why or why not?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'What would you say you have too much of?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'Do you "find love" or does "love find you"?');
END $$;

DO $$
DECLARE
  ref_id uuid;
BEGIN
  INSERT INTO reflections (title, subtitle, category, sort_order, is_active, is_featured, is_free, shuffle_mode)
  VALUES ('Adulting', 'Who is someone you can offer help to?', 'big-picture', 62, true, false, true, true)
  RETURNING id INTO ref_id;
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 0, 'question', 'Who is someone you can offer help to?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 1, 'question', 'What is one thing someone else relies on you for?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 2, 'question', 'How do you decide what to spend time on?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 3, 'question', 'What is one thing you do that makes you feel young?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 4, 'question', 'Describe a moment you felt mature.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 5, 'question', 'What did you do on your last birthday?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 6, 'question', 'Describe a time that felt like a lose-lose situation.');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 7, 'question', 'What is one TV show that meant a lot to you as an adult?');
  INSERT INTO reflection_pages (reflection_id, page_order, type, content) VALUES (ref_id, 8, 'question', 'What piece of advice do you wish you got earlier?');
END $$;