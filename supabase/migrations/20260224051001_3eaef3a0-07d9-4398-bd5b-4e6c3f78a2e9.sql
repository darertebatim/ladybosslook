
DO $$
DECLARE
  ref1_id uuid;
  ref2_id uuid;
  ref3_id uuid;
BEGIN
  -- 1. When You Feel Anxious
  INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
  VALUES ('When You Feel Anxious', 'You will have peace and tranquility here.', NULL, true, false, 3)
  RETURNING id INTO ref1_id;

  INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
    (ref1_id, 0, 'message', 'Take a deep breath.', 'If one isn''t enough, take a few more and then answer a few questions.'),
    (ref1_id, 1, 'question', 'What makes you anxious?', NULL),
    (ref1_id, 2, 'question', 'What causes you the most anxiety? What steps can you take to mitigate it?', NULL),
    (ref1_id, 3, 'question', 'Of the things that make you anxious, which do you find easiest to deal with?', 'Deal with it as soon as possible!'),
    (ref1_id, 4, 'question', 'Do these things create the same level of anxiety for other people? Do you suffer from excessive anxiety?', NULL),
    (ref1_id, 5, 'question', 'What would you say to someone who is struggling with the same problem as you?', 'Look for him/her and have that conversation.'),
    (ref1_id, 6, 'message', 'All good things come together only when you start to deal with things that make you anxious.', 'Exercise releases endorphins (happiness hormones), so get moving when you feel overwhelmed.'),
    (ref1_id, 7, 'message', 'Stay in close contact with nature.', E'Enjoy the sunset and dusk, feel the night wind, and experience the purity and beauty in peace.'),
    (ref1_id, 8, 'message', 'Read books.', 'Experience the protagonist''s joys and sorrows. Find your own shadow in other people''s stories, and use their experiences to adjust your perspective.'),
    (ref1_id, 9, 'message', 'Organize a schedule.', 'A lot of anxiety is caused when people don''t organize their time properly and throw themselves out of rhythm. When you organize and complete daily tasks calmly, you naturally feel confident and accomplished, and anxiety tends to subside.');

  -- 2. When You Feel Sad
  INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
  VALUES ('When You Feel Sad', 'Here''s candy for you.', NULL, true, false, 4)
  RETURNING id INTO ref2_id;

  INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
    (ref2_id, 0, 'message', 'This is your place to talk.', NULL),
    (ref2_id, 1, 'question', 'What makes you sad?', NULL),
    (ref2_id, 2, 'question', 'What kinds of thoughts do you have as a result of your sadness?', NULL),
    (ref2_id, 3, 'question', 'Are these notions entirely correct? Things may not be as bad as you think. How can you refute your thoughts?', NULL),
    (ref2_id, 4, 'question', 'If your thinking has some errors, what is the truth?', NULL),
    (ref2_id, 5, 'message', 'You no longer like the things you once liked, and you begin to distance yourself from the world.', 'Sadness is like a river changing course, and different people deal with the situation in different ways.'),
    (ref2_id, 6, 'message', 'Many people deal with sadness by indulging in seemingly useless activities.', 'Like building sandcastles, doodling, writing, or walking. These pleasant hobbies pass the time and are usually connected with beauty, art, nature, exercise, soul-searching, the meaning of life, philosophy, and/or religion.'),
    (ref2_id, 7, 'message', 'These pursuits may not generate fame or wealth.', 'But in times of sadness, they become a very important way to cope.');

  -- 3. When You Want to Overeat
  INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
  VALUES ('When You Want to Overeat', 'Your behavior are the reason.', NULL, true, false, 5)
  RETURNING id INTO ref3_id;

  INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
    (ref3_id, 0, 'message', 'Let''s have you do some movements.', 'Put your feet on the floor, close your eyes, take a few slow and natural breaths, cross your arms across your chest, pat yourself alternately with your left and right hands 4 to 12 times, and then answer a few questions.'),
    (ref3_id, 1, 'question', 'Why do you keep eating when you''re not hungry?', NULL),
    (ref3_id, 2, 'question', 'Think of someone you admire. What would he/she do in a situation like this?', NULL),
    (ref3_id, 3, 'message', 'So many people love you, enjoy you, need you, and want a better you!', NULL),
    (ref3_id, 4, 'message', 'If you still want to eat, choose something relatively low-calorie and healthy,', 'like a few sugar-free mints. Try chewing more slowly.'),
    (ref3_id, 5, 'message', 'Make sure you eat three meals a day.', 'Don''t let yourself get too hungry or too full.'),
    (ref3_id, 6, 'message', 'Do not keep junk food within easy reach.', 'If you don''t buy the food you can''t eat it.'),
    (ref3_id, 7, 'message', 'Develop good habits, sleep regularly, and exercise.', 'Studies have found that 35 minutes of exercise a day can reduce the risk of depression by 17 percent.');
END $$;
