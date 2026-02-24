
DO $$
DECLARE
  ref1 uuid;
  ref2 uuid;
  ref3 uuid;
  ref4 uuid;
  ref5 uuid;
BEGIN

-- 1. When You Abuse Alcohol
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES ('When You Abuse Alcohol', 'Run away from the chaos and chase the sun.', NULL, true, false, 10)
RETURNING id INTO ref1;

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
(ref1, 0, 'message', 'Please take a few deep breaths and then answer some questions.', NULL),
(ref1, 1, 'message', 'Thank you for being here. When you''re in trouble, I''ll always be here for you as long as you need me.', NULL),
(ref1, 2, 'question', 'Do you have concerns about your drinking problem?', 'Let''s analyze those concerns!'),
(ref1, 3, 'question', 'What are your main concerns?', NULL),
(ref1, 4, 'message', '"Simply put, developing physical dependence is addiction and can bring all kinds of chaos to an individual''s life." (Todd Crandell, Choice and Success)', NULL),
(ref1, 5, 'question', 'Do you think alcoholism does more good than harm or does the harm outweigh the good?', NULL),
(ref1, 6, 'question', 'Do you want to change?', 'If so, do something about it! Believe that you have the power to change, and when you do change, you''ll have joy.'),
(ref1, 7, 'message', 'If you have an alcohol dependence, don''t stop drinking suddenly.', 'As it will likely lead to a withdrawal reaction. At this time, you should be under the guidance of professional doctors and seeking help through medical means.');

-- 2. When Work Makes You Angry
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES ('When Work Makes You Angry', 'Don''t let anger control you!', NULL, true, false, 11)
RETURNING id INTO ref2;

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
(ref2, 0, 'message', 'Take a deep breath.', 'If one isn''t enough, take a few more and then answer a few questions.'),
(ref2, 1, 'question', 'What are you angry about?', NULL),
(ref2, 2, 'question', 'Write down everything you want to say.', NULL),
(ref2, 3, 'question', 'How would you rate your anger right now?', E'On a scale of 0-10:\n0 — Mild anger you hardly notice\n1-3 — Mild anger you can forget about quickly\n4-6 — Anger that still bothers you after a period of time\n7-9 — Intense anger\n10 — Super-strong anger that you can''t tolerate'),
(ref2, 4, 'message', 'Imagine something that gives you peace of mind, like a calm lake or a peaceful forest.', NULL),
(ref2, 5, 'message', 'Slowly count up until you feel better and can stop.', NULL),
(ref2, 6, 'message', 'Take a few more deep breaths!', NULL),
(ref2, 7, 'message', 'Now you''ve landed safely!', NULL),
(ref2, 8, 'message', 'People need at least six seconds for rationality to take effect after anger has set in.', NULL),
(ref2, 9, 'message', 'You have to take action in order to not let your anger boil over into ugly words and violent actions.', 'If you are irritable, you need to put in a lot of anger-management practice.');

-- 3. You Need to Communicate
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES ('You Need to Communicate', 'Communication is a bridge to building good relationships.', NULL, true, false, 12)
RETURNING id INTO ref3;

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
(ref3, 0, 'question', 'What problem are you trying to solve? What exactly will be discussed?', NULL),
(ref3, 1, 'question', 'When, where, and in what way do you think your words will be most acceptable to others?', NULL),
(ref3, 2, 'question', 'Can you listen patiently?', 'Doing so will help you gain understanding and trust.'),
(ref3, 3, 'question', 'Can you empathize with and calm your communication partner?', E'Labeling other people''s feelings and directly expressing their current emotions and real needs will enhance their sense of trust and security. For example: "I know you are sad."'),
(ref3, 4, 'message', 'Timely and effective communication can clear up doubts, reduce misunderstandings, build relationships, and solve problems.', NULL);

-- 4. Travel Diary
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES ('Travel Diary', 'A trip is worth documenting.', NULL, true, false, 13)
RETURNING id INTO ref4;

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
(ref4, 0, 'question', 'Where did you go? How do you feel?', NULL),
(ref4, 1, 'question', 'Describe the new things you saw.', NULL),
(ref4, 2, 'question', 'What kinds of experiences make you feel good?', NULL),
(ref4, 3, 'question', 'Where would you like to travel next? What experiences do you want to have?', NULL),
(ref4, 4, 'message', 'Keeping a travel diary will bring you a lot of happiness.', 'If you ever find yourself feeling a little blue, come back and read your travel diary!');

-- 5. Happy Diary
INSERT INTO reflections (title, subtitle, cover_image_url, is_active, is_featured, sort_order)
VALUES ('Happy Diary', 'Record every happy moment.', NULL, true, false, 14)
RETURNING id INTO ref5;

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
(ref5, 0, 'question', 'Write down as many things as you can that made you happy today or recently.', NULL),
(ref5, 1, 'message', 'These happy things are the world''s gift to you!', NULL),
(ref5, 2, 'question', 'What are you looking forward to tomorrow or in the next few days that will make you happy?', NULL),
(ref5, 3, 'message', 'Keep a happy diary to help you focus on happiness all the time.', NULL),
(ref5, 4, 'question', 'How do you feel after writing in your journal?', NULL),
(ref5, 5, 'message', 'If one day you feel a little down, come back and read these happy diaries!', NULL);

END $$;
