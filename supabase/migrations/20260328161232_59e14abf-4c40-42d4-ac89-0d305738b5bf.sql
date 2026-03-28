
-- Reflection 1: Savoring Pleasant Moments
INSERT INTO reflections (id, title, subtitle, is_active, is_featured, is_free, category, sort_order)
VALUES ('a1b2c3d4-1111-4000-a000-000000000001', 'Savoring Pleasant Moments', 'Savor positive moments to better appreciate your life', true, false, false, 'deep-dives', 15);

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-1111-4000-a000-000000000001', 1, 'message',
 '"Savoring is the practice of truly being mindful of the moment and fully appreciating an experience."

It can help create, intensify, and lengthen positive emotions from doing any activity, especially one that you love.

Any moment can be savored. Even activities as simple as a hot shower, a meal, or drinking a thirst-quenching glass of water are opportunities to savor.', NULL),

('a1b2c3d4-1111-4000-a000-000000000001', 2, 'question',
 'What is a moment in your past that you enjoyed or are grateful for?',
 'This might be a hot cup of coffee during a cold morning, or feeling a cool breeze on a hot summer day.'),

('a1b2c3d4-1111-4000-a000-000000000001', 3, 'question',
 'What do you remember about this moment?',
 'Recollect on physical sensations, thoughts, mood, or emotions.'),

('a1b2c3d4-1111-4000-a000-000000000001', 4, 'message',
 'Focusing on the present moment: Now we''ll focus on the present. Take a few minutes and go do something that brings you joy. You might choose to go for a short walk, listen to your favorite song, or take a hot shower. As you''re doing the activity, try to stay in the present moment and truly appreciate what you are doing. Come back here when you are finished.', NULL),

('a1b2c3d4-1111-4000-a000-000000000001', 5, 'question',
 'What activity did you choose?',
 'Example: Listening to my favorite song.'),

('a1b2c3d4-1111-4000-a000-000000000001', 6, 'question',
 'How did you feel during this activity?',
 'Recollect on physical sensations, thoughts, mood, or emotions.'),

('a1b2c3d4-1111-4000-a000-000000000001', 7, 'question',
 'What experience are you looking forward to having?',
 'Let''s look to the future. In order to have a positive relationship to our future, it''s important that we have things we can look forward to. This could be something you plan to do later today or this weekend, or it might be an upcoming trip you''re excited about.'),

('a1b2c3d4-1111-4000-a000-000000000001', 8, 'question',
 'What excites you about this future activity? How do you feel when you think about this activity?',
 'Example: I''m looking forward to seeing my friend because it''s been weeks since I last saw them.');

-- Reflection 2: Loving-Kindness
INSERT INTO reflections (id, title, subtitle, is_active, is_featured, is_free, category, sort_order)
VALUES ('a1b2c3d4-2222-4000-a000-000000000002', 'Loving-Kindness', 'Cultivate feelings of compassion or good will', true, false, false, 'deep-dives', 16);

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-2222-4000-a000-000000000002', 1, 'message',
 'Loving-Kindness

"We practice loving-kindness when we cultivate feelings of compassion or good will and direct these feelings at ourselves, loved ones, or even strangers."

This deep dive will guide you through a framework you can use to practice loving-kindness.

How to Practice Loving-Kindness:
In this practice, we will be directing positive wishes towards people in our lives.

Some examples:
May John find peace and tranquility.
May Anna stay in good health.
May Alice find fulfillment in her career.', NULL),

('a1b2c3d4-2222-4000-a000-000000000002', 2, 'question',
 'Choose someone close to you whom you want to be happy.',
 'Example: My friend Ellie.'),

('a1b2c3d4-2222-4000-a000-000000000002', 3, 'question',
 'Picture this person in your mind and imagine their happiness. What are some positive things you wish for them?',
 'Example: May Ellie feel proud of all the progress she made on her mental health this past year.'),

('a1b2c3d4-2222-4000-a000-000000000002', 4, 'question',
 'Pick someone you are not close to.',
 'Think of someone you''ve met, but are not close to. This could be a cashier in the grocery store, a distant acquaintance, or even someone you bumped into at the park.'),

('a1b2c3d4-2222-4000-a000-000000000002', 5, 'question',
 'Picture this person in your mind and imagine their happiness. What are some positive things you wish for them?',
 'Example: May the barista I met this morning only have customers who are as kind-hearted as they are.'),

('a1b2c3d4-2222-4000-a000-000000000002', 6, 'message',
 'Self-directed Loving-Kindness

Now turn your attention inwards and reflect on positive things you wish for yourself. This can feel hard to do, but self-compassion is just as important as being compassionate towards others.

For this exercise, frame your statements in the first person:
May I find peace and tranquility.
May I stay in good physical health for many more years.', NULL),

('a1b2c3d4-2222-4000-a000-000000000002', 7, 'question',
 'What are some positive wishes you have for yourself and your own life?',
 'Example: May I find compassion and kindness in my relationships.'),

('a1b2c3d4-2222-4000-a000-000000000002', 8, 'question',
 'On a scale of 0 - 10, how much compassion do you feel for yourself right now?', NULL);

-- Reflection 3: What Would You Say to a Loved One?
INSERT INTO reflections (id, title, subtitle, is_active, is_featured, is_free, category, sort_order)
VALUES ('a1b2c3d4-3333-4000-a000-000000000003', 'What Would You Say to a Loved One?', 'Direct compassion inwards towards yourself.', true, false, false, 'deep-dives', 17);

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-3333-4000-a000-000000000003', 1, 'message',
 'What Would You Say to a Loved One

It can feel easy to blame ourselves for bad situations, to think we''re not "good enough", or to feel we don''t deserve happiness. Yet when someone we care about approaches us with a problem, we tend to be much more positive and supportive.

This deep dive aims to take the compassion we show to other people and direct it inwards to ourselves.', NULL),

('a1b2c3d4-3333-4000-a000-000000000003', 2, 'question',
 'What is a recent situation where you responded with self-critical thoughts or negative self talk?',
 'Example: I dropped a plate full of food and made a huge mess.'),

('a1b2c3d4-3333-4000-a000-000000000003', 3, 'question',
 'What was your response to the situation?',
 'What did you tell yourself during the situation? How did your response to the situation make you feel?'),

('a1b2c3d4-3333-4000-a000-000000000003', 4, 'question',
 'Who is someone that you support and care about?',
 'Example: My friend Susan.'),

('a1b2c3d4-3333-4000-a000-000000000003', 5, 'question',
 'What if this person came to you in the situation you were in? What would you say to them?', NULL),

('a1b2c3d4-3333-4000-a000-000000000003', 6, 'question',
 'How did your response change when it was directed at someone close to you vs directed at yourself?', NULL),

('a1b2c3d4-3333-4000-a000-000000000003', 7, 'message',
 'Being Kind to Yourself:

We tend to be harsher to ourselves than we are to the people we care about. This habit can feel hard to change, but acknowledging it is the first step!

Next time you''re in a difficult situation, try to be more mindful of your self-talk. If you notice it feels particularly critical, ask yourself: "Is this something I would say to a friend?"', NULL),

('a1b2c3d4-3333-4000-a000-000000000003', 8, 'question',
 'Next time you''re struggling, will you try to treat yourself like you would a friend?',
 'Say: I promise'),

('a1b2c3d4-3333-4000-a000-000000000003', 9, 'question',
 'How likely are you to be kinder to yourself the next time you are struggling (On a scale of 1 - 5)?',
 'With 1 meaning ''not at all likely'' and 5 meaning ''highly likely''');

-- Reflection 4: Managing Your Triggers
INSERT INTO reflections (id, title, subtitle, is_active, is_featured, is_free, category, sort_order)
VALUES ('a1b2c3d4-4444-4000-a000-000000000004', 'Managing Your Triggers', 'Handle difficult situations that cause emotional distress.', true, false, false, 'deep-dives', 18);

INSERT INTO reflection_pages (reflection_id, page_order, type, content, description) VALUES
('a1b2c3d4-4444-4000-a000-000000000004', 1, 'message',
 'Managing Your Triggers

Many of us may have an immediate negative response to certain events that we would like to change. Maybe our heart rate increases and we get anxious every time a stranger makes eye contact. Or maybe our anger rises quickly when someone does something we don''t like. This exercise helps us explore these triggering events.', NULL),

('a1b2c3d4-4444-4000-a000-000000000004', 2, 'question',
 'What is one trigger you want to work on?',
 'Examples: Uncomfortable social situations; Riding in cars; Having conversations that involve a difficult topic.'),

('a1b2c3d4-4444-4000-a000-000000000004', 3, 'question',
 'What stimuli is associated with this trigger?',
 'This could be something someone might say, seeing a person, hearing a sound, etc.'),

('a1b2c3d4-4444-4000-a000-000000000004', 4, 'question',
 'What automatic responses do you have to this trigger?',
 'These might be emotions you feel, thought patterns, or bodily sensations.'),

('a1b2c3d4-4444-4000-a000-000000000004', 5, 'message',
 'Techniques for when you''re triggered:

When something triggers you it can lead to intense emotional distress. There are different strategies you can try for managing this distress including:

• Deep breathing exercises / other relaxation techniques.
• Journaling techniques to help you process / understand how you''re feeling.
• Talking to a friend.

It''s hard to think of these strategies in the heat of the moment. By taking the time to reflect on them now, you can make it easier / more automatic to take positive actions to manage your distress.', NULL),

('a1b2c3d4-4444-4000-a000-000000000004', 6, 'question',
 'What is one technique you want to try in the future to help yourself when you realize you''ve been triggered?', NULL);
