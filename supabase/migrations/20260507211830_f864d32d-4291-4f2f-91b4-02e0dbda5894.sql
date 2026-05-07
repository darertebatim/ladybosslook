
WITH r AS (
  INSERT INTO routines_bank (title, subtitle, emoji, color, category, schedule_type, end_mode, end_after_days, is_active, is_popular, is_free, sort_order)
  VALUES
    ('Period Care Routine','Your body is working hard this week. Work with it, not against it.','🌸','pink','selfcare','challenge','after_days',5,true,true,true,100),
    ('New Mom Self-Care Routine','You matter too — even when everything is about the baby right now.','🤱','peach','selfcare','challenge','after_days',21,true,true,true,101),
    ('After a Breakup Routine','Grief is real. So is your strength. Both can be true at once.','💗','lavender','selfcare','challenge','after_days',7,true,true,true,102),
    ('ADHD Routine','Your brain works differently. This routine works with it.','🧠','sky','selfcare','challenge','after_days',14,true,true,true,103),
    ('Anxiety Relief Routine','When everything feels loud — come back to right here, right now.','🌬️','mint','selfcare','challenge','after_days',3,true,true,true,104),
    ('Anti-Procrastination Routine','You don''t need to feel ready. You just need to begin.','🎯','yellow','selfcare','challenge','after_days',14,true,true,true,105),
    ('Working Parent Routine','You''re doing an incredible job. This routine helps you keep going.','👨‍👩‍👧','peach','selfcare','challenge','after_days',21,true,true,true,106),
    ('After a Hard Day Routine','The day is done. You carried it well. Now put it down.','🌙','purple','selfcare','challenge','after_days',3,true,true,true,107),
    ('Loneliness Routine','The antidote to loneliness is one small act of connection.','💕','pink','selfcare','challenge','after_days',7,true,true,true,108),
    ('Career Stress Routine','High pressure is part of building something great. Stay grounded while you do it.','💼','sky','selfcare','challenge','after_days',14,true,true,true,109)
  RETURNING id, title
),
tasks AS (
  SELECT * FROM (VALUES
    -- Period Care (5d)
    ('Period Care Routine', 1, 'f487889c-c05f-4ca0-95fc-60ea17088e5e'::uuid, 'Take 3 Deep breaths', '🌬️'),
    ('Period Care Routine', 2, 'de0560b8-e739-4263-ab44-28ba5b8ac3db'::uuid, 'Do a quick body scan for tension or relaxation', '🧘'),
    ('Period Care Routine', 3, 'fc7b534d-f21c-4743-9b2d-ea462dcd2a8a'::uuid, 'Drink a glass of water with every meal', '💧'),
    ('Period Care Routine', 4, 'fbaac9d3-c2ca-46be-8890-c276135b7eff'::uuid, 'Give myself permission to rest', '😌'),
    ('Period Care Routine', 5, '855e18df-79e7-4196-9efa-cc4580c5fc92'::uuid, 'Make myself a cup of chamomile tea after dinner', '🍵'),
    ('Period Care Routine', 6, 'aab476e5-8faa-44f1-ae45-23e4ee912c82'::uuid, 'Say one thing I''m grateful for before bed', '🙏'),
    -- New Mom (21d)
    ('New Mom Self-Care Routine', 1, '6e4cb26c-6e6a-439b-9ce1-a0670eed18ca'::uuid, 'Wash face', '🧼'),
    ('New Mom Self-Care Routine', 2, 'c2e67b75-7d07-4244-ab25-c6063c185b88'::uuid, 'Keep a water bottle around throughout the day', '💧'),
    ('New Mom Self-Care Routine', 3, '4e15d72f-00f0-4f9c-bac4-b9485173ef7e'::uuid, 'Step outside once', '🚶'),
    ('New Mom Self-Care Routine', 4, '7e298831-7935-4ddd-945f-83ee8091875a'::uuid, 'Say one kind thing to myself as if I were a friend', '💬'),
    ('New Mom Self-Care Routine', 5, '858f3eeb-d267-4e13-b07a-f14048fd5e5d'::uuid, 'Wind down with a sleep breathing exercise before bed', '😴'),
    -- After a Breakup (7d)
    ('After a Breakup Routine', 1, '0c7be162-8297-4d48-bbf4-79a55d2d1e65'::uuid, 'Smile at myself in the mirror', '🪞'),
    ('After a Breakup Routine', 2, '1c7fe435-00b0-4a36-b2d5-ef82c5d22b38'::uuid, 'Go for a 5-minute walk', '🚶'),
    ('After a Breakup Routine', 3, 'c1e0374c-ca49-4820-88ca-bcd61dd0c674'::uuid, 'Allow myself to feel my emotions without judgment', '💭'),
    ('After a Breakup Routine', 4, '77bb3a28-3b05-4692-a0f4-cd3140d121aa'::uuid, 'Name one person who cares for me', '💕'),
    ('After a Breakup Routine', 5, '7e298831-7935-4ddd-945f-83ee8091875a'::uuid, 'Say one kind thing to myself as if I were a friend', '💬'),
    ('After a Breakup Routine', 6, 'b243d32f-1f21-4b98-9352-899ffffd38c2'::uuid, 'Write down all my thoughts and worries', '📝'),
    ('After a Breakup Routine', 7, 'c5a020ce-8276-4cec-bfad-e6ddf235d1ef'::uuid, 'Thank myself for making it through the day', '💪'),
    -- ADHD (14d)
    ('ADHD Routine', 1, 'f487889c-c05f-4ca0-95fc-60ea17088e5e'::uuid, 'Take 3 Deep breaths', '🌬️'),
    ('ADHD Routine', 2, '6cf2dfee-c55a-4f80-b78e-33ccf2057e20'::uuid, 'Plan top 3 priorities', '💼'),
    ('ADHD Routine', 3, '312a7f0e-e793-4220-8310-dcaffbaf2d52'::uuid, 'Break a task into smaller steps', '📊'),
    ('ADHD Routine', 4, '09853feb-97a0-411c-9007-95dfd2d6eb3c'::uuid, 'Turn off notifications for 1 hour', '🔕'),
    ('ADHD Routine', 5, 'c3ddd142-a473-42b9-9188-3052f70579e9'::uuid, 'Try a focus timer for deep work', '⏱️'),
    ('ADHD Routine', 6, 'dc597c9a-9220-40cf-b9c3-c0c2226bc52e'::uuid, 'Name one thing I accomplished at the end of the day', '🏆'),
    -- Anxiety Relief (3d)
    ('Anxiety Relief Routine', 1, 'f487889c-c05f-4ca0-95fc-60ea17088e5e'::uuid, 'Take 3 Deep breaths', '🌬️'),
    ('Anxiety Relief Routine', 2, 'de0560b8-e739-4263-ab44-28ba5b8ac3db'::uuid, 'Do a quick body scan for tension or relaxation', '🧘'),
    ('Anxiety Relief Routine', 3, 'c9e42794-42a3-425e-8c65-589b10691e4f'::uuid, 'Do a mindful breathing exercise', '🧘'),
    ('Anxiety Relief Routine', 4, 'e528f113-048d-40f2-ad97-28c7328d4d59'::uuid, 'Take a short walk without distraction', '🚶'),
    ('Anxiety Relief Routine', 5, 'e16e75b8-e0c4-42e5-a229-21d0fb19890d'::uuid, 'Visualize a peaceful place', '🏝️'),
    ('Anxiety Relief Routine', 6, '7e298831-7935-4ddd-945f-83ee8091875a'::uuid, 'Say one kind thing to myself as if I were a friend', '💬'),
    -- Anti-Procrastination (14d)
    ('Anti-Procrastination Routine', 1, 'bb9c574b-1502-4e33-8a1b-af7f0bcd1dca'::uuid, 'Write down my goals in the morning', '🌅'),
    ('Anti-Procrastination Routine', 2, '5d8580dd-241b-4f4a-a8a3-3023946a0e49'::uuid, 'Write down the first step of my task', '1️⃣'),
    ('Anti-Procrastination Routine', 3, 'f5680c4b-5885-4e93-9b4c-2f8e52bc91c4'::uuid, 'Start with the most important task', '🎯'),
    ('Anti-Procrastination Routine', 4, 'c3ddd142-a473-42b9-9188-3052f70579e9'::uuid, 'Try a focus timer for deep work', '⏱️'),
    ('Anti-Procrastination Routine', 5, 'bbf362cd-0581-4f66-975b-097fda718ad2'::uuid, 'Check off one item from my to-do list', '✅'),
    -- Working Parent (21d)
    ('Working Parent Routine', 1, '8bce1022-163c-46a1-bcd3-b196f40b3517'::uuid, 'Get 10 min of sunlight in the morning', '☀️'),
    ('Working Parent Routine', 2, '20aa2fba-1c42-4b6a-97fc-05a9639ce843'::uuid, 'Fill my water bottle', '🫗'),
    ('Working Parent Routine', 3, 'b62f5c6f-1ff3-4765-8438-d330db95bbc1'::uuid, 'Eat my meal without my phone or TV', '🍽️'),
    ('Working Parent Routine', 4, 'b5282e69-23ef-4a61-946d-cabeb822734f'::uuid, 'Spend time with family', '👨‍👩‍👧'),
    ('Working Parent Routine', 5, '449e9d40-7661-4409-8657-268cb2d7f306'::uuid, 'Put my phone away when spending time with a loved one', '📵'),
    ('Working Parent Routine', 6, '569ba3ab-504b-4546-874b-fbfb88bbc6a1'::uuid, 'Write down my goals for tomorrow', '📝'),
    ('Working Parent Routine', 7, 'fa6751f1-a8ec-4a8e-a0b9-5a86b9a014c3'::uuid, 'Go to bed at the same time every night', '🛏️'),
    -- After a Hard Day (3d)
    ('After a Hard Day Routine', 1, 'fde60c67-30da-4971-9145-c6dd3e2d3900'::uuid, 'Spend 5 minutes tidying my home', '🏠'),
    ('After a Hard Day Routine', 2, 'a60dec44-47ba-4869-a35e-fe99d15b0992'::uuid, 'Dim lights before bed', '💡'),
    ('After a Hard Day Routine', 3, '85d1b3aa-e006-4073-887c-14addfaab936'::uuid, 'Write down 2 things that weigh me down before sleeping', '✍️'),
    ('After a Hard Day Routine', 4, '858f3eeb-d267-4e13-b07a-f14048fd5e5d'::uuid, 'Wind down with a sleep breathing exercise before bed', '😴'),
    ('After a Hard Day Routine', 5, '7e298831-7935-4ddd-945f-83ee8091875a'::uuid, 'Say one kind thing to myself as if I were a friend', '💬'),
    ('After a Hard Day Routine', 6, 'aab476e5-8faa-44f1-ae45-23e4ee912c82'::uuid, 'Say one thing I''m grateful for before bed', '🙏'),
    -- Loneliness (7d)
    ('Loneliness Routine', 1, '77bb3a28-3b05-4692-a0f4-cd3140d121aa'::uuid, 'Name one person who cares for me', '💕'),
    ('Loneliness Routine', 2, 'ece780d2-ca4e-41fe-ad78-860b259197a9'::uuid, 'Send a kind message', '💕'),
    ('Loneliness Routine', 3, '72d93d32-c9b3-4e41-9881-de70be85be04'::uuid, 'Check in on someone I care about', '💌'),
    ('Loneliness Routine', 4, '33998f05-017f-4065-9473-d3da65de2ff1'::uuid, 'Express gratitude to a loved one', '❤️'),
    ('Loneliness Routine', 5, '6b49c114-ba8e-473d-8d11-b710c65fb7b5'::uuid, 'Hug a loved one before bed', '🫂'),
    -- Career Stress (14d)
    ('Career Stress Routine', 1, '6cf2dfee-c55a-4f80-b78e-33ccf2057e20'::uuid, 'Plan top 3 priorities', '💼'),
    ('Career Stress Routine', 2, '09853feb-97a0-411c-9007-95dfd2d6eb3c'::uuid, 'Turn off notifications for 1 hour', '🔕'),
    ('Career Stress Routine', 3, 'f487889c-c05f-4ca0-95fc-60ea17088e5e'::uuid, 'Take 3 Deep breaths', '🌬️'),
    ('Career Stress Routine', 4, '1c7fe435-00b0-4a36-b2d5-ef82c5d22b38'::uuid, 'Go for a 5-minute walk', '🚶'),
    ('Career Stress Routine', 5, 'b62f5c6f-1ff3-4765-8438-d330db95bbc1'::uuid, 'Eat my meal without my phone or TV', '🍽️'),
    ('Career Stress Routine', 6, 'fb8a7d24-0086-48b7-94ed-41b0d4001596'::uuid, 'Tell myself "I just need to do my best" when overwhelmed', '🌊'),
    ('Career Stress Routine', 7, 'dc597c9a-9220-40cf-b9c3-c0c2226bc52e'::uuid, 'Name one thing I accomplished at the end of the day', '🏆')
  ) AS t(routine_title, task_order, task_id, title, emoji)
)
INSERT INTO routines_bank_tasks (routine_id, task_id, title, emoji, task_order)
SELECT r.id, t.task_id, t.title, t.emoji, t.task_order
FROM tasks t JOIN r ON r.title = t.routine_title;
