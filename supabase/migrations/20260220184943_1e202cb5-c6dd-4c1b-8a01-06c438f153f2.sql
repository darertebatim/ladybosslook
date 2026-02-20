
-- Tasks for Ritual 1: How Can I Suppress Hunger?
-- Weekly tasks with specific days (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once) VALUES
  (gen_random_uuid(), '11a2b3c4-d5e6-7890-abcd-ef1234567801', 'Coffee', '☕', 1, ARRAY[0,2,4,6], false),
  (gen_random_uuid(), '11a2b3c4-d5e6-7890-abcd-ef1234567801', 'Drink tea', '🍵', 2, ARRAY[1,3,5], false),
  (gen_random_uuid(), '11a2b3c4-d5e6-7890-abcd-ef1234567801', 'Eat an apple', '🍎', 3, ARRAY[5], false),
  (gen_random_uuid(), '11a2b3c4-d5e6-7890-abcd-ef1234567801', 'Get enough sleep', '😴', 4, ARRAY[6], false),
  (gen_random_uuid(), '11a2b3c4-d5e6-7890-abcd-ef1234567801', 'Drink water', '💧', 5, ARRAY[6], false);

-- Tasks for Ritual 2: How to Sleep Well? (all daily)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once) VALUES
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Slip into your jammies', '👚', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Stretch', '🤸', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Reflect on my day', '🖊️', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Milk', '🥛', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Aroma candle', '🕯️', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Music on', '🎼', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), '22a2b3c4-d5e6-7890-abcd-ef1234567802', 'Track sleep', '🛌', 7, ARRAY[0,1,2,3,4,5,6], false);
