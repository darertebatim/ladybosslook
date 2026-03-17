
DO $$
DECLARE
  v_rid uuid;
  v_rs int := 54;
  v_ts int := 464;
BEGIN

-- ===== MORNING FOCUS =====

-- R1: 2026 New Me
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('2026 New Me', '<p>2026 is a great moment to reset and start fresh. The Reboot Routine is a 20-minute daily reset that helps you quickly organize your body, space, and thoughts to realign with the year. Start 2026 right from this very moment.</p>', 'Morning-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>2026 is a great moment to reset and start fresh. The Reboot Routine is a 20-minute daily reset that helps you quickly organize your body, space, and thoughts to realign with the year. Start 2026 right from this very moment.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Make the bed','🛏️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Drink a glass of water','💧',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Open window & air out','🪟',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Light stretching','🧘',1,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'3-min space reset','🧹',3,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Digital cleanup','📱',1,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Write 1 priority','✍️',2,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'5-min deep focus','🎯',5,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Finish 1 delayed task','✅',3,'{0,1,2,3,4,5,6}',9,false),
(v_rid,'Emotional check-in','💭',1,'{0,1,2,3,4,5,6}',10,false),
(v_rid,'One line of encouragement','💪',1,'{0,1,2,3,4,5,6}',11,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Make the bed','🛏️','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts,true),
('Drink a glass of water','💧','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Open window & air out','🪟','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Light stretching','🧘','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+3,true),
('3-min space reset','🧹','yellow','Morning-Focus','daily',3,true,'timer',180,v_ts+4,true),
('Digital cleanup','📱','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+5,true),
('Write 1 priority','✍️','yellow','Morning-Focus','daily',2,true,'timer',120,v_ts+6,true),
('5-min deep focus','🎯','yellow','Morning-Focus','daily',5,true,'timer',300,v_ts+7,true),
('Finish 1 delayed task','✅','yellow','Morning-Focus','daily',3,true,'timer',180,v_ts+8,true),
('Emotional check-in','💭','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+9,true),
('One line of encouragement','💪','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+10,true);
v_ts:=v_ts+11;

-- R2: Miracle Morning
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Miracle Morning', '<p>Getting everything you want out of life isn''t about doing more. It''s about becoming more. Hal Elrod and The Miracle Morning have helped millions of people become the person they need to be to create the life they''ve always wanted. Now, it''s your turn.</p><p>Hal''s revolutionary S.A.V.E.R.S. method is a simple, effective step-by-step process to transform your life in as little as six minutes per day.</p>', 'Morning-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Getting everything you want out of life isn''t about doing more. It''s about becoming more. Hal Elrod and The Miracle Morning have helped millions of people become the person they need to be to create the life they''ve always wanted. Now, it''s your turn.</p><p>Hal''s revolutionary S.A.V.E.R.S. method is a simple, effective step-by-step process to transform your life in as little as six minutes per day.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Tidy up your bed','🛏️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Take deep breaths and meditate','🧘',1,'{0,1,2,3,4,5,6}',2,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Tidy up your bed','🛏️','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts,true),
('Take deep breaths and meditate','🧘','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+1,true);
v_ts:=v_ts+2;

-- R3: Calm & Ready Morning
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Calm & Ready Morning', '<p>Create a morning where you leave on time without rushing.</p>', 'Morning-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Create a morning where you leave on time without rushing.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Drink water','💧',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Take a shower','🚿',15,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Do your skincare routine','✨',4,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Change your clothes','👗',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Style your hair/outfit','💇',20,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Check today''s schedule','📋',5,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Prepare your essentials','🎒',10,'{0,1,2,3,4,5,6}',7,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Drink water','💧','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts,true),
('Take a shower','🚿','yellow','Morning-Focus','daily',15,true,'timer',900,v_ts+1,true),
('Do your skincare routine','✨','yellow','Morning-Focus','daily',4,true,'timer',240,v_ts+2,true),
('Change your clothes','👗','yellow','Morning-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Style your hair/outfit','💇','yellow','Morning-Focus','daily',20,true,'timer',1200,v_ts+4,true),
('Check today''s schedule','📋','yellow','Morning-Focus','daily',5,true,'timer',300,v_ts+5,true),
('Prepare your essentials','🎒','yellow','Morning-Focus','daily',10,true,'timer',600,v_ts+6,true);
v_ts:=v_ts+7;

-- R4: Morning Growth Hour
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Morning Growth Hour', '<p>The small but steady sense of accomplishment you feel in the morning makes the rest of your day more productive.</p>', 'Morning-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>The small but steady sense of accomplishment you feel in the morning makes the rest of your day more productive.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Prepare tea/coffee','☕',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Read the newspaper','📰',10,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Set goals and to-dos','📋',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Write a gratitude journal','🙏',20,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Study','📚',20,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Prepare tea/coffee','☕','yellow','Morning-Focus','daily',5,true,'timer',300,v_ts,true),
('Read the newspaper','📰','yellow','Morning-Focus','daily',10,true,'timer',600,v_ts+1,true),
('Set goals and to-dos','📋','yellow','Morning-Focus','daily',5,true,'timer',300,v_ts+2,true),
('Write a gratitude journal','🙏','yellow','Morning-Focus','daily',20,true,'timer',1200,v_ts+3,true),
('Study','📚','yellow','Morning-Focus','daily',20,true,'timer',1200,v_ts+4,true);
v_ts:=v_ts+5;

-- R5: Energy Boost Morning
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Energy Boost Morning', '<p>Build an energetic day with small, healthy habits.</p>', 'Morning-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Build an energetic day with small, healthy habits.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Check your sleep time','😴',2,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Do some stretching','🧘',3,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Get some sunlight','☀️',2,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Turn on your favorite music','🎵',2,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Do a home workout','🏋️',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Prepare your meal and supplements','🍳',10,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Have breakfast','🥣',15,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Take supplements','💊',1,'{0,1,2,3,4,5,6}',8,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Check your sleep time','😴','yellow','Morning-Focus','daily',2,true,'timer',120,v_ts,true),
('Do some stretching','🧘','yellow','Morning-Focus','daily',3,true,'timer',180,v_ts+1,true),
('Get some sunlight','☀️','yellow','Morning-Focus','daily',2,true,'timer',120,v_ts+2,true),
('Turn on your favorite music','🎵','yellow','Morning-Focus','daily',2,true,'timer',120,v_ts+3,true),
('Do a home workout','🏋️','yellow','Morning-Focus','daily',10,true,'timer',600,v_ts+4,true),
('Prepare your meal and supplements','🍳','yellow','Morning-Focus','daily',10,true,'timer',600,v_ts+5,true),
('Have breakfast','🥣','yellow','Morning-Focus','daily',15,true,'timer',900,v_ts+6,true),
('Take supplements','💊','yellow','Morning-Focus','daily',1,true,'timer',60,v_ts+7,true);
v_ts:=v_ts+8;

-- ===== EVENING FOCUS =====

-- R1: Reflect & Unwind
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Reflect & Unwind', '<p>Having a good evening routine can bring good balance to your morning.</p>', 'Evening-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Having a good evening routine can bring good balance to your morning.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Turn off electronics','📵',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Diary','✍️',10,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Prepare outfit for tomorrow','👗',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Shower','🚿',15,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Skin care','✨',3,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Bedtime meditation','🧘',12,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Turn off electronics','📵','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts,true),
('Diary','✍️','yellow','Evening-Focus','daily',10,true,'timer',600,v_ts+1,true),
('Prepare outfit for tomorrow','👗','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+2,true),
('Shower','🚿','yellow','Evening-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Skin care','✨','yellow','Evening-Focus','daily',3,true,'timer',180,v_ts+4,true),
('Bedtime meditation','🧘','yellow','Evening-Focus','daily',12,true,'timer',720,v_ts+5,true);
v_ts:=v_ts+6;

-- R2: Warm Relax Bath
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Warm Relax Bath', '<p>Did you know that half-body bathing boosts blood flow, which works as detox and calms the nervous system?</p>', 'Evening-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Did you know that half-body bathing boosts blood flow, which works as detox and calms the nervous system?</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Get water set to 38-40 degrees','🌡️',10,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Wear a bathrobe','🧖',3,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Comb hair','💇',3,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Add bath bombs','🧼',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Aroma candle','🕯️',1,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Prepare a book','📖',1,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Half body bath','🛁',15,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Tub cleanup','🧹',5,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Drink warm water','💧',5,'{0,1,2,3,4,5,6}',9,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Get water set to 38-40 degrees','🌡️','yellow','Evening-Focus','daily',10,true,'timer',600,v_ts,true),
('Wear a bathrobe','🧖','yellow','Evening-Focus','daily',3,true,'timer',180,v_ts+1,true),
('Comb hair','💇','yellow','Evening-Focus','daily',3,true,'timer',180,v_ts+2,true),
('Add bath bombs','🧼','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Aroma candle','🕯️','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+4,true),
('Prepare a book','📖','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+5,true),
('Half body bath','🛁','yellow','Evening-Focus','daily',15,true,'timer',900,v_ts+6,true),
('Tub cleanup','🧹','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+7,true),
('Drink warm water','💧','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+8,true);
v_ts:=v_ts+9;

-- R3: Reading before sleep
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Reading before sleep', '<p>Scientists recommend you stop using your smartphone at least 30 minutes before bedtime.</p>', 'Evening-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Scientists recommend you stop using your smartphone at least 30 minutes before bedtime.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Switch to airplane mode','✈️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Turn on lamp','💡',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Make tea','☕',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Prepare notebook and pen','📝',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Read a book','📖',30,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Write down reflections','✍️',5,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Switch to airplane mode','✈️','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts,true),
('Turn on lamp','💡','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Make tea','☕','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+2,true),
('Prepare notebook and pen','📝','yellow','Evening-Focus','daily',3,true,'timer',180,v_ts+3,true),
('Read a book','📖','yellow','Evening-Focus','daily',30,true,'timer',1800,v_ts+4,true),
('Write down reflections','✍️','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+5,true);
v_ts:=v_ts+6;

-- R4: Mindful Journaling
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Mindful Journaling', '<p>Relax, de-stress, and unwind before heading to bed.</p>', 'Evening-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Relax, de-stress, and unwind before heading to bed.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Change into comfortable clothes','👕',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Candle','🕯️',3,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Humidifier','💨',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Breath','🧘',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Journal questions and answers','✍️',10,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Change into comfortable clothes','👕','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts,true),
('Candle','🕯️','yellow','Evening-Focus','daily',3,true,'timer',180,v_ts+1,true),
('Humidifier','💨','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Breath','🧘','yellow','Evening-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Journal questions and answers','✍️','yellow','Evening-Focus','daily',10,true,'timer',600,v_ts+4,true);
v_ts:=v_ts+5;

-- R5: Miracle Evening
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Miracle Evening', '<p>Hal Elrod, author of the book Miracle Morning, has been practicing Miracle Morning for 15 years. He realized that a successful Miracle Morning is just as important as an evening routine at the end of the day. The acronym for his eight evening routines is SLUMBERS. It''s simple, so you can get used to it quickly.</p>', 'Evening-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Hal Elrod, author of the book Miracle Morning, has been practicing Miracle Morning for 15 years. He realized that a successful Miracle Morning is just as important as an evening routine at the end of the day. The acronym for his eight evening routines is SLUMBERS. It''s simple, so you can get used to it quickly.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Stop eating 3 to 4 hours before bed','🍽️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Let go of stressful thoughts and feelings','💭',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Use natural sleep aids if needed','🌿',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Map out your next day','📋',1,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Boycott blue light','📵',1,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Enter a blissful state with bedtime affirmations','🙏',1,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Read a book that makes you feel good','📖',1,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Sleep like a baby','😴',1,'{0,1,2,3,4,5,6}',8,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Stop eating 3 to 4 hours before bed','🍽️','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts,true),
('Let go of stressful thoughts and feelings','💭','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Use natural sleep aids if needed','🌿','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Map out your next day','📋','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+3,true),
('Boycott blue light','📵','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+4,true),
('Enter a blissful state with bedtime affirmations','🙏','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+5,true),
('Read a book that makes you feel good','📖','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+6,true),
('Sleep like a baby','😴','yellow','Evening-Focus','daily',1,true,'timer',60,v_ts+7,true);
v_ts:=v_ts+8;

-- ===== PRODUCTIVITY FOCUS =====

-- R1: Quick Reset
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Quick Reset', '<p>2026 is a great moment to reset and start fresh. The Reboot Routine is a 20-minute daily reset that helps you quickly organize your body, space, and thoughts to realign with the year.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>2026 is a great moment to reset and start fresh. The Reboot Routine is a 20-minute daily reset that helps you quickly organize your body, space, and thoughts to realign with the year.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Drink a glass of water','💧',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Open window & air out','🪟',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Light stretching','🧘',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'3-min space reset','🧹',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Digital cleanup','📱',1,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Write 1 priority','✍️',2,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'5-min deep focus','🎯',5,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Finish 1 delayed task','✅',3,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Emotional check-in','💭',1,'{0,1,2,3,4,5,6}',9,false),
(v_rid,'One line of encouragement','💪',1,'{0,1,2,3,4,5,6}',10,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Drink a glass of water','💧','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts,true),
('Open window & air out','🪟','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Light stretching','🧘','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+2,true),
('3-min space reset','🧹','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+3,true),
('Digital cleanup','📱','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+4,true),
('Write 1 priority','✍️','pink','Productivity-Focus','daily',2,true,'timer',120,v_ts+5,true),
('5-min deep focus','🎯','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+6,true),
('Finish 1 delayed task','✅','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+7,true),
('Emotional check-in','💭','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+8,true),
('One line of encouragement','💪','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+9,true);
v_ts:=v_ts+10;

-- R2: Pomodoro
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Pomodoro', '<p>The pomodoro method helps you stay focused and minimise mental fatigue. Do you know pomodoro means tomato in Italian? 🍅</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>The pomodoro method helps you stay focused and minimise mental fatigue. Do you know pomodoro means tomato in Italian? 🍅</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Concentration','🎯',25,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Rest','☕',5,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Concentration','🎯',25,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Rest','☕',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Concentration','🎯',25,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Rest','☕',5,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Concentration','🎯',25,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Long break','🌴',15,'{0,1,2,3,4,5,6}',8,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Concentration','🎯','pink','Productivity-Focus','daily',25,true,'timer',1500,v_ts,true),
('Rest','☕','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Long break','🌴','pink','Productivity-Focus','daily',15,true,'timer',900,v_ts+2,true);
v_ts:=v_ts+3;

-- R3: Stoic Man
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Stoic Man', '<p>The Stoic mind embraces resilience, rationality, and inner peace, focusing on what can be controlled and accepting what cannot. It values virtue, wisdom, and emotional equanimity, seeking to align with nature and reason.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>The Stoic mind embraces resilience, rationality, and inner peace, focusing on what can be controlled and accepting what cannot. It values virtue, wisdom, and emotional equanimity, seeking to align with nature and reason.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Start with a Quote','💬',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Morning Journaling','✍️',120,'{0,1,2,3,4,5,6}',2,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Start with a Quote','💬','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts,true),
('Morning Journaling','✍️','pink','Productivity-Focus','daily',120,true,'timer',7200,v_ts+1,true);
v_ts:=v_ts+2;

-- R4: Glow & Care Routine
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Glow & Care Routine', '<p>That Girl aesthetics emphasize a polished, organized lifestyle. It features clean, minimalist design, healthy habits, and a focus on self-care.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>That Girl aesthetics emphasize a polished, organized lifestyle. It features clean, minimalist design, healthy habits, and a focus on self-care.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Rise and Shine','☀️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Avoid social media','📵',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Drink Water','💧',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Plan out your day','📋',15,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Morning Beverage','☕',15,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Make up and outfit','💄',30,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Rise and Shine','☀️','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts,true),
('Avoid social media','📵','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Drink Water','💧','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Plan out your day','📋','pink','Productivity-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Morning Beverage','☕','pink','Productivity-Focus','daily',15,true,'timer',900,v_ts+4,true),
('Make up and outfit','💄','pink','Productivity-Focus','daily',30,true,'timer',1800,v_ts+5,true);
v_ts:=v_ts+6;

-- R5: Study Focus Timer
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Study Focus Timer', '<p>Having a distinct study schedule helps you keep on track and not forget important aspects such as reviewing.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Having a distinct study schedule helps you keep on track and not forget important aspects such as reviewing.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Check the subject of study','📚',10,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Concentration','🎯',50,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Rest','☕',10,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Concentration','🎯',50,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Rest','☕',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Revise','📝',30,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Check the subject of study','📚','pink','Productivity-Focus','daily',10,true,'timer',600,v_ts,true),
('Revise','📝','pink','Productivity-Focus','daily',30,true,'timer',1800,v_ts+1,true);
v_ts:=v_ts+2;

-- R6: Work Kickstart
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Work Kickstart', '<p>Setting a clear routine for work can make you quickly work and leave more time to focus.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Setting a clear routine for work can make you quickly work and leave more time to focus.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Humidifier ON','💨',2,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Coffee in tumbler','☕',4,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Computer ON','💻',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Check email','📧',10,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Check to-do list','📋',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Prioritize tasks','🎯',5,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Check meeting schedule','📅',3,'{0,1,2,3,4,5,6}',7,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Humidifier ON','💨','pink','Productivity-Focus','daily',2,true,'timer',120,v_ts,true),
('Coffee in tumbler','☕','pink','Productivity-Focus','daily',4,true,'timer',240,v_ts+1,true),
('Computer ON','💻','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Check email','📧','pink','Productivity-Focus','daily',10,true,'timer',600,v_ts+3,true),
('Check to-do list','📋','pink','Productivity-Focus','daily',10,true,'timer',600,v_ts+4,true),
('Prioritize tasks','🎯','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+5,true),
('Check meeting schedule','📅','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+6,true);
v_ts:=v_ts+7;

-- R7: Ready for remote work
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Ready for remote work', '<p>Create a work from home routine to help you stay away from distractions.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Create a work from home routine to help you stay away from distractions.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Make bed','🛏️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Wash face','🧼',3,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Do breathing meditation','🧘',10,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Change clothes','👔',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Prepare coffee and snack','☕',15,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Go to desk','🪑',2,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Clean up desk','🧹',5,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Turn on laptop','💻',1,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Make a to-do list','📋',10,'{0,1,2,3,4,5,6}',9,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Make bed','🛏️','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts,true),
('Wash face','🧼','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+1,true),
('Do breathing meditation','🧘','pink','Productivity-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Change clothes','👔','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Prepare coffee and snack','☕','pink','Productivity-Focus','daily',15,true,'timer',900,v_ts+4,true),
('Go to desk','🪑','pink','Productivity-Focus','daily',2,true,'timer',120,v_ts+5,true),
('Clean up desk','🧹','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+6,true),
('Turn on laptop','💻','pink','Productivity-Focus','daily',1,true,'timer',60,v_ts+7,true),
('Make a to-do list','📋','pink','Productivity-Focus','daily',10,true,'timer',600,v_ts+8,true);
v_ts:=v_ts+9;

-- R8: Daily cleaning routine
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Daily cleaning routine', '<p>Enjoy an uncluttered and clean home during the weekend.</p>', 'Productivity-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Enjoy an uncluttered and clean home during the weekend.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Make bed','🛏️',3,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Unclutter your stuff','📦',5,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Wash dishes','🍽️',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Wipe kitchen counters & sink','🧽',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Throw out bad food','🗑️',3,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Wipe bathroom sink & mirror','🪞',5,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Recycle','♻️',5,'{0,1,2,3,4,5,6}',7,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Unclutter your stuff','📦','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts,true),
('Wash dishes','🍽️','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Wipe kitchen counters & sink','🧽','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+2,true),
('Throw out bad food','🗑️','pink','Productivity-Focus','daily',3,true,'timer',180,v_ts+3,true),
('Wipe bathroom sink & mirror','🪞','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+4,true),
('Recycle','♻️','pink','Productivity-Focus','daily',5,true,'timer',300,v_ts+5,true);
v_ts:=v_ts+6;

-- ===== HEALTH FOCUS =====

-- R1: Selfcare time
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Selfcare time', '<p>Do you have a tendency to forget to take care of yourself? Make it a routine to prioritise yourself first.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Do you have a tendency to forget to take care of yourself? Make it a routine to prioritise yourself first.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Jazz music','🎵',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Change into bathrobe','🧖',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Shower','🚿',15,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Exfoliation, cleansing','✨',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Dry hair','💇',5,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Skin care','✨',3,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Mask pack','🧖',15,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Eye cream','👁️',1,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Hair oil','💆',5,'{0,1,2,3,4,5,6}',9,false),
(v_rid,'Lymphatic massage','💆',10,'{0,1,2,3,4,5,6}',10,false),
(v_rid,'Lip balm','💋',1,'{0,1,2,3,4,5,6}',11,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Jazz music','🎵','yellow','Health-Focus','daily',5,true,'timer',300,v_ts,true),
('Change into bathrobe','🧖','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Exfoliation, cleansing','✨','yellow','Health-Focus','daily',3,true,'timer',180,v_ts+2,true),
('Dry hair','💇','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Mask pack','🧖','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+4,true),
('Eye cream','👁️','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+5,true),
('Hair oil','💆','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+6,true),
('Lymphatic massage','💆','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+7,true),
('Lip balm','💋','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+8,true);
v_ts:=v_ts+9;

-- R2: Mood Lift Morning
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Mood Lift Morning', '<p>Small changes will lead to big changes.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Small changes will lead to big changes.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Make the bed','🛏️',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Open the curtains','🪟',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Open the window','🪟',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Drink a glass of water','💧',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Brush teeth','🪥',3,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Open the curtains','🪟','yellow','Health-Focus','daily',1,true,'timer',60,v_ts,true),
('Brush teeth','🪥','yellow','Health-Focus','daily',3,true,'timer',180,v_ts+1,true);
v_ts:=v_ts+2;

-- R3: Refresh Jog
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Refresh Jog', '<p>Science says running lowers blood pressure, improve blood sugar control and lower cholesterol.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Science says running lowers blood pressure, improve blood sugar control and lower cholesterol.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Change into running clothes','👟',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Drinking water','💧',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Eat light snacks','🍌',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Earphones, bring water','🎧',10,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Play podcast or music for running','🎵',3,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Warmup','🏃',5,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Start recording your run','⏱️',1,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Running','🏃',30,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Foam Rolling','🧘',10,'{0,1,2,3,4,5,6}',9,false),
(v_rid,'Shower','🚿',15,'{0,1,2,3,4,5,6}',10,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Change into running clothes','👟','yellow','Health-Focus','daily',5,true,'timer',300,v_ts,true),
('Eat light snacks','🍌','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Earphones, bring water','🎧','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Play podcast or music for running','🎵','yellow','Health-Focus','daily',3,true,'timer',180,v_ts+3,true),
('Warmup','🏃','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+4,true),
('Start recording your run','⏱️','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+5,true),
('Running','🏃','yellow','Health-Focus','daily',30,true,'timer',1800,v_ts+6,true),
('Foam Rolling','🧘','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+7,true);
v_ts:=v_ts+8;

-- R4: Home Spa Relax
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Home Spa Relax', '<p>Spoil your body and mind! Maintain good skin health, improve blood circulation and relieve stress!</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Spoil your body and mind! Maintain good skin health, improve blood circulation and relieve stress!</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Set phone to flight mode','✈️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Change into bathrobe','🧖',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Prepare drink','🥤',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Prepare snacks','🍪',2,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Light a candle','🕯️',1,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Lo-Fi music playlist','🎵',1,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Wash face','🧼',3,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Sheet face mask','🧖',15,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Prepare foot bath','🛁',5,'{0,1,2,3,4,5,6}',9,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Set phone to flight mode','✈️','yellow','Health-Focus','daily',1,true,'timer',60,v_ts,true),
('Prepare drink','🥤','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Prepare snacks','🍪','yellow','Health-Focus','daily',2,true,'timer',120,v_ts+2,true),
('Light a candle','🕯️','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+3,true),
('Lo-Fi music playlist','🎵','yellow','Health-Focus','daily',1,true,'timer',60,v_ts+4,true),
('Sheet face mask','🧖','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+5,true),
('Prepare foot bath','🛁','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+6,true);
v_ts:=v_ts+7;

-- R5: After-Work Unwind
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('After-Work Unwind', '<p>Research shows that relaxation keeps your heart healthier, improves brain function and helps you avoid depression.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Research shows that relaxation keeps your heart healthier, improves brain function and helps you avoid depression.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Turn off phone notifications','📵',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Light a candle','🕯️',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Deep breathing exercise','🧘',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Write a journal','✍️',10,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Take a walk','🚶',15,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Listen to music','🎵',10,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Schedule a fun activity','🎉',5,'{0,1,2,3,4,5,6}',7,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Turn off phone notifications','📵','yellow','Health-Focus','daily',1,true,'timer',60,v_ts,true),
('Deep breathing exercise','🧘','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Write a journal','✍️','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Take a walk','🚶','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Listen to music','🎵','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+4,true),
('Schedule a fun activity','🎉','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+5,true);
v_ts:=v_ts+6;

-- R6: Sleep Easy Routine
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Sleep Easy Routine', '<p>Do you have insomnia? Create a calming environment.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Do you have insomnia? Create a calming environment.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Aroma Oil + Humidifier','🌸',3,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Dim the lights','💡',2,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Drink hot tea','☕',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Light stretch','🧘',10,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Meditate while lying down','🧘',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Listen to ASMR','🎧',5,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Aroma Oil + Humidifier','🌸','yellow','Health-Focus','daily',3,true,'timer',180,v_ts,true),
('Dim the lights','💡','yellow','Health-Focus','daily',2,true,'timer',120,v_ts+1,true),
('Drink hot tea','☕','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+2,true),
('Light stretch','🧘','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+3,true),
('Meditate while lying down','🧘','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+4,true),
('Listen to ASMR','🎧','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+5,true);
v_ts:=v_ts+6;

-- R7: PMS Comfort Care
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('PMS Comfort Care', '<p>Sometimes the best thing to do for your body and mind is just to lie on the sofa with a warm water bottle and eat some chocolate.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Sometimes the best thing to do for your body and mind is just to lie on the sofa with a warm water bottle and eat some chocolate.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Drink a glass of water','💧',2,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Pain relief medicine','💊',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Turn off phone notifications','📵',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Drink hot chocolate','☕',15,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Hug a warm water bottle','🤗',20,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Take a nap','😴',15,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Prepare snacks','🍫',10,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Watch a movie','🎬',120,'{0,1,2,3,4,5,6}',8,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Pain relief medicine','💊','yellow','Health-Focus','daily',1,true,'timer',60,v_ts,true),
('Drink hot chocolate','☕','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+1,true),
('Hug a warm water bottle','🤗','yellow','Health-Focus','daily',20,true,'timer',1200,v_ts+2,true),
('Take a nap','😴','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Watch a movie','🎬','yellow','Health-Focus','daily',120,true,'timer',7200,v_ts+4,true);
v_ts:=v_ts+5;

-- R8: Confidence Reset
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Confidence Reset', '<p>Take time to relax and be aware of how you are feeling.</p>', 'Health-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Take time to relax and be aware of how you are feeling.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Do a breathing exercise','🧘',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Call a friend or family member','📞',15,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Write down your feelings','✍️',10,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Write down expectations or positive thoughts','💭',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Treat yourself to a favorite snack or hobby time','🎁',15,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Do a breathing exercise','🧘','yellow','Health-Focus','daily',5,true,'timer',300,v_ts,true),
('Call a friend or family member','📞','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+1,true),
('Write down your feelings','✍️','yellow','Health-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Write down expectations or positive thoughts','💭','yellow','Health-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Treat yourself to a favorite snack or hobby time','🎁','yellow','Health-Focus','daily',15,true,'timer',900,v_ts+4,true);
v_ts:=v_ts+5;

-- ===== RELATIONSHIP FOCUS =====

-- R1: Time with family
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Time with family', '<p>If you''re a forgetful person and living a stressful life, make it a routine to spend time with family so you don''t forget your loved ones.</p>', 'Relationship-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>If you''re a forgetful person and living a stressful life, make it a routine to spend time with family so you don''t forget your loved ones.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Hug family','🤗',12,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Ask "How was your day?"','💬',5,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Cook dinner','🍳',15,'{0,1,2,3,4,5,6}',3,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Hug family','🤗','yellow','Relationship-Focus','daily',12,true,'timer',720,v_ts,true),
('Ask "How was your day?"','💬','yellow','Relationship-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Cook dinner','🍳','yellow','Relationship-Focus','daily',15,true,'timer',900,v_ts+2,true);
v_ts:=v_ts+3;

-- R2: Joyful Child Time
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Joyful Child Time', '<p>It can benefit both you and your children to have the same routine every day.</p>', 'Relationship-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>It can benefit both you and your children to have the same routine every day.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Ask how today was','💬',10,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Dinner','🍽️',25,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Bathtime','🛁',12,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Read books, play with toys','📖',30,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Organize things together','📦',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Put to bed','🛏️',10,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Ask how today was','💬','yellow','Relationship-Focus','daily',10,true,'timer',600,v_ts,true),
('Dinner','🍽️','yellow','Relationship-Focus','daily',25,true,'timer',1500,v_ts+1,true),
('Bathtime','🛁','yellow','Relationship-Focus','daily',12,true,'timer',720,v_ts+2,true),
('Read books, play with toys','📖','yellow','Relationship-Focus','daily',30,true,'timer',1800,v_ts+3,true),
('Organize things together','📦','yellow','Relationship-Focus','daily',10,true,'timer',600,v_ts+4,true),
('Put to bed','🛏️','yellow','Relationship-Focus','daily',10,true,'timer',600,v_ts+5,true);
v_ts:=v_ts+6;

-- R3: Baby care
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Baby care', '<p>Having a distinct routine helps your baby keep healthy eating and sleeping schedule and reduces some stress off the parents.</p>', 'Relationship-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Having a distinct routine helps your baby keep healthy eating and sleeping schedule and reduces some stress off the parents.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Breastfeed','🍼',20,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Bathe','🛁',30,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Lotion','🧴',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Change clothes','👶',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Saying ''I love you''','❤️',3,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Put to bed','🛏️',20,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Breastfeed','🍼','yellow','Relationship-Focus','daily',20,true,'timer',1200,v_ts,true),
('Bathe','🛁','yellow','Relationship-Focus','daily',30,true,'timer',1800,v_ts+1,true),
('Lotion','🧴','yellow','Relationship-Focus','daily',5,true,'timer',300,v_ts+2,true),
('Saying ''I love you''','❤️','yellow','Relationship-Focus','daily',3,true,'timer',180,v_ts+3,true);
v_ts:=v_ts+4;

-- ===== PETS FOCUS =====

-- R1: Morning Dog Walk
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Morning Dog Walk', '<p>When your dog can predict the next it will help them feel secure and let their guard down.</p>', 'Pets-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>When your dog can predict the next it will help them feel secure and let their guard down.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Pet and cuddle','🐕',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Change water','💧',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Meal time','🍖',3,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Walk','🚶',15,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Bonding & exercise','🎾',5,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Pet and cuddle','🐕','yellow','Pets-Focus','daily',5,true,'timer',300,v_ts,true),
('Change water','💧','yellow','Pets-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Meal time','🍖','yellow','Pets-Focus','daily',3,true,'timer',180,v_ts+2,true),
('Walk','🚶','yellow','Pets-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Bonding & exercise','🎾','yellow','Pets-Focus','daily',5,true,'timer',300,v_ts+4,true);
v_ts:=v_ts+5;

-- R2: Cat Care Morning
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Cat Care Morning', '<p>A structured routine will make your cat more confident, happy and prevent boredom.</p>', 'Pets-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>A structured routine will make your cat more confident, happy and prevent boredom.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Change water','💧',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Refill food','🐱',2,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Pet and cuddle','🐱',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Scoop litter box','🧹',10,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Play','🧶',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Treats','🐱',2,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Refill food','🐱','yellow','Pets-Focus','daily',2,true,'timer',120,v_ts,true),
('Scoop litter box','🧹','yellow','Pets-Focus','daily',10,true,'timer',600,v_ts+1,true),
('Play','🧶','yellow','Pets-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Treats','🐱','yellow','Pets-Focus','daily',2,true,'timer',120,v_ts+3,true);
v_ts:=v_ts+4;

-- ===== SOS FOCUS =====

-- R1: When You Feel Overwhelmed
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('When You Feel Overwhelmed', '<p>A grounding routine that uses sight, sound, and touch to calm an overactive mind. When anxiety or worried thoughts appear without reason, use it as first aid to bring yourself back to the present. This routine does not replace medical treatment. Seek professional help if needed.</p>', 'Sos-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>A grounding routine that uses sight, sound, and touch to calm an overactive mind. When anxiety or worried thoughts appear without reason, use it as first aid to bring yourself back to the present. This routine does not replace medical treatment. Seek professional help if needed.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'4-6 breathing','🧘',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Palm grounding','🤲',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Fixed gaze','👁️',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Listen to 3 sounds','👂',1,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Slow exhale x3','💨',1,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('4-6 breathing','🧘','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts,true),
('Palm grounding','🤲','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Fixed gaze','👁️','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Listen to 3 sounds','👂','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+3,true),
('Slow exhale x3','💨','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+4,true);
v_ts:=v_ts+5;

-- R2: When You Feel Anxious
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('When You Feel Anxious', '<p>A grounding routine that uses sight, sound, and touch to calm an overactive mind. When anxiety or worried thoughts appear without reason, use it as first aid to bring yourself back to the present. This SOS routine does not replace medical treatment. Seek professional help if needed.</p>', 'Sos-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>A grounding routine that uses sight, sound, and touch to calm an overactive mind. When anxiety or worried thoughts appear without reason, use it as first aid to bring yourself back to the present. This SOS routine does not replace medical treatment. Seek professional help if needed.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Find 5 colors','🌈',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'List 3 sounds','👂',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Write one body feeling','✍️',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Touch cold water','💧',1,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Hold a warm cup','☕',1,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Find 5 colors','🌈','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts,true),
('List 3 sounds','👂','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Write one body feeling','✍️','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Touch cold water','💧','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+3,true),
('Hold a warm cup','☕','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+4,true);
v_ts:=v_ts+5;

-- R3: When Your Mood Swings
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('When Your Mood Swings', '<p>A routine that calms overloaded emotional circuits by engaging sound and touch. This SOS routine does not replace medical treatment. Seek professional help if needed.</p>', 'Sos-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>A routine that calms overloaded emotional circuits by engaging sound and touch. This SOS routine does not replace medical treatment. Seek professional help if needed.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Feel cold','❄️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Listen to one calming sound','🎵',1,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Press your feet','🦶',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Press fingers one by one','✋',1,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Write "I''m okay"','✍️',1,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Feel cold','❄️','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts,true),
('Listen to one calming sound','🎵','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+1,true),
('Press your feet','🦶','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Press fingers one by one','✋','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+3,true),
('Write "I''m okay"','✍️','yellow','Sos-Focus','daily',1,true,'timer',60,v_ts+4,true);
v_ts:=v_ts+5;

-- ===== THE FAMOUS FOCUS =====

-- R1: Andrew Huberman
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Andrew Huberman', '<p>Andrew Huberman advocates starting the day with exposure to natural light, which helps regulate the circadian rhythm and halt the production of melatonin. He emphasizes the importance of sunlight exposure, even on cloudy days, to maintain optimal brain function and hormonal balance. Following the light exposure, Huberman recommends engaging in physical activity to boost mental clarity and overall health. He also advises against using electronic devices immediately after waking, to minimize stress and enhance focus.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Andrew Huberman advocates starting the day with exposure to natural light, which helps regulate the circadian rhythm and halt the production of melatonin. He emphasizes the importance of sunlight exposure, even on cloudy days, to maintain optimal brain function and hormonal balance. Following the light exposure, Huberman recommends engaging in physical activity to boost mental clarity and overall health. He also advises against using electronic devices immediately after waking, to minimize stress and enhance focus.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Drink 2 glasses of water','💧',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Yoga Nidra','🧘',35,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Sun Exposure','☀️',10,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Cold Exposure','❄️',5,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Workout','🏋️',60,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Morning Caffeine','☕',10,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Drink 2 glasses of water','💧','yellow','The-Famous-Focus','daily',1,true,'timer',60,v_ts,true),
('Yoga Nidra','🧘','yellow','The-Famous-Focus','daily',35,true,'timer',2100,v_ts+1,true),
('Sun Exposure','☀️','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Cold Exposure','❄️','yellow','The-Famous-Focus','daily',5,true,'timer',300,v_ts+3,true),
('Workout','🏋️','yellow','The-Famous-Focus','daily',60,true,'timer',3600,v_ts+4,true),
('Morning Caffeine','☕','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+5,true);
v_ts:=v_ts+6;

-- R2: Kim Kardashian
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Kim Kardashian', '<p>Kim Kardashian is an American media personality, socialite, and businesswoman, known for her reality TV show "Keeping Up with the Kardashians," beauty brand KKW Beauty, and strong social media presence.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Kim Kardashian is an American media personality, socialite, and businesswoman, known for her reality TV show "Keeping Up with the Kardashians," beauty brand KKW Beauty, and strong social media presence.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Early Riser','☀️',1,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Treadmill Run','🏃',15,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Abs and Legs','🏋️',60,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Nutritious Breakfast','🍳',15,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Hour long Bath','🛁',60,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Early Riser','☀️','yellow','The-Famous-Focus','daily',1,true,'timer',60,v_ts,true),
('Treadmill Run','🏃','yellow','The-Famous-Focus','daily',15,true,'timer',900,v_ts+1,true),
('Abs and Legs','🏋️','yellow','The-Famous-Focus','daily',60,true,'timer',3600,v_ts+2,true),
('Nutritious Breakfast','🍳','yellow','The-Famous-Focus','daily',15,true,'timer',900,v_ts+3,true),
('Hour long Bath','🛁','yellow','The-Famous-Focus','daily',60,true,'timer',3600,v_ts+4,true);
v_ts:=v_ts+5;

-- R3: Tim Cook
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Tim Cook', '<p>Tim Cook, the CEO of Apple, begins his day exceptionally early, waking up at 3:45 a.m. His morning starts with reading user feedback on Apple products, allowing him to directly connect with customer experiences. Following this, he engages in a morning workout, which helps him maintain physical and mental clarity. He also makes time to review global financial news, staying informed on worldwide economic trends. This disciplined morning routine sets a productive tone for his day.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Tim Cook, the CEO of Apple, begins his day exceptionally early, waking up at 3:45 a.m. His morning starts with reading user feedback on Apple products, allowing him to directly connect with customer experiences. Following this, he engages in a morning workout, which helps him maintain physical and mental clarity. He also makes time to review global financial news, staying informed on worldwide economic trends. This disciplined morning routine sets a productive tone for his day.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Reading Emails','📧',60,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Workout','🏋️',60,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Getting Ready For The Workday','👔',60,'{0,1,2,3,4,5,6}',3,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Reading Emails','📧','yellow','The-Famous-Focus','daily',60,true,'timer',3600,v_ts,true),
('Getting Ready For The Workday','👔','yellow','The-Famous-Focus','daily',60,true,'timer',3600,v_ts+1,true);
v_ts:=v_ts+2;

-- R4: Jeff Bezos
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Jeff Bezos', '<p>Jeff Bezos is one of the world''s richest men and the founder of Amazon. Surprisingly he starts his mornings slowly and makes sure to get time to himself before work begins. "I like to putter in the morning, I like to read the newspaper, I like to have coffee, I like to have breakfast with my kids before they go to school, so having this kind of puttering time is very important to me." Bezos makes sure to get 8 hours of sleep every night since he notices a big difference in energy and excitement if he doesn''t.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Jeff Bezos is one of the world''s richest men and the founder of Amazon. Surprisingly he starts his mornings slowly and makes sure to get time to himself before work begins. "I like to putter in the morning, I like to read the newspaper, I like to have coffee, I like to have breakfast with my kids before they go to school, so having this kind of puttering time is very important to me." Bezos makes sure to get 8 hours of sleep every night since he notices a big difference in energy and excitement if he doesn''t.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Do nothing','😌',5,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Read newspaper','📰',10,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Drink coffee','☕',10,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Workout','🏋️',20,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Cook breakfast','🍳',20,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Eat breakfast with family','👨‍👩‍👧‍👦',30,'{0,1,2,3,4,5,6}',6,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Do nothing','😌','yellow','The-Famous-Focus','daily',5,true,'timer',300,v_ts,true),
('Read newspaper','📰','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+1,true),
('Drink coffee','☕','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Cook breakfast','🍳','yellow','The-Famous-Focus','daily',20,true,'timer',1200,v_ts+3,true),
('Eat breakfast with family','👨‍👩‍👧‍👦','yellow','The-Famous-Focus','daily',30,true,'timer',1800,v_ts+4,true);
v_ts:=v_ts+5;

-- R5: Tim Ferriss
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Tim Ferriss', '<p>Tim Ferriss is the author of The 4-Hour Workweek. He created his own routine inspired by the morning rituals of successful people. He starts with ''making the bed'', which gives him a sense of accomplishment. Simple habits such as meditation, exercise, and diary might seem trivial, but they can be powerful enough to bring change when continued steadily.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Tim Ferriss is the author of The 4-Hour Workweek. He created his own routine inspired by the morning rituals of successful people. He starts with ''making the bed'', which gives him a sense of accomplishment. Simple habits such as meditation, exercise, and diary might seem trivial, but they can be powerful enough to bring change when continued steadily.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Make Bed','🛏️',3,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Meditation','🧘',20,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Exercise','🏋️',1,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Drink Tea','☕',3,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Journal','✍️',10,'{0,1,2,3,4,5,6}',5,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Make Bed','🛏️','yellow','The-Famous-Focus','daily',3,true,'timer',180,v_ts,true),
('Meditation','🧘','yellow','The-Famous-Focus','daily',20,true,'timer',1200,v_ts+1,true),
('Exercise','🏋️','yellow','The-Famous-Focus','daily',1,true,'timer',60,v_ts+2,true),
('Drink Tea','☕','yellow','The-Famous-Focus','daily',3,true,'timer',180,v_ts+3,true),
('Journal','✍️','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+4,true);
v_ts:=v_ts+5;

-- R6: Oprah Winfrey
INSERT INTO routines_bank (title, description, category, schedule_type, sort_order, is_active, is_free) VALUES
('Oprah Winfrey', '<p>Oprah Winfrey is the world''s most influential woman. "The sound of the alarm makes me nervous. So I start the day quietly without a sound." She trains her body through exercise, and fills her mind with meditation and gratitude diary. The "365 Gathered Truths" card set is also a daily inspiration to her. Continuous physical and mental training is the secret to maintaining her positive feelings.</p>', 'The-Famous-Focus', 'ongoing', v_rs, true, true) RETURNING id INTO v_rid; v_rs:=v_rs+1;
INSERT INTO routines_bank_sections (routine_id, title, content, section_order) VALUES (v_rid, 'Introduction', '<p>Oprah Winfrey is the world''s most influential woman. "The sound of the alarm makes me nervous. So I start the day quietly without a sound." She trains her body through exercise, and fills her mind with meditation and gratitude diary. The "365 Gathered Truths" card set is also a daily inspiration to her. Continuous physical and mental training is the secret to maintaining her positive feelings.</p>', 1);
INSERT INTO routines_bank_tasks (routine_id, title, emoji, duration_minutes, schedule_days, task_order, is_once) VALUES
(v_rid,'Brush Teeth','🪥',3,'{0,1,2,3,4,5,6}',1,false),
(v_rid,'Drink Cappuccino','☕',2,'{0,1,2,3,4,5,6}',2,false),
(v_rid,'Go to Gym','🏃',5,'{0,1,2,3,4,5,6}',3,false),
(v_rid,'Exercise','🏋️',50,'{0,1,2,3,4,5,6}',4,false),
(v_rid,'Meditation','🧘',10,'{0,1,2,3,4,5,6}',5,false),
(v_rid,'Breakfast','🍳',10,'{0,1,2,3,4,5,6}',6,false),
(v_rid,'Walk dog','🐕',20,'{0,1,2,3,4,5,6}',7,false),
(v_rid,'Read 5 inspirational cards','📖',2,'{0,1,2,3,4,5,6}',8,false),
(v_rid,'Gratitude journal','🙏',10,'{0,1,2,3,4,5,6}',9,false);
INSERT INTO admin_task_bank (title, emoji, color, category, repeat_pattern, duration_minutes, goal_enabled, goal_type, goal_target, sort_order, is_active) VALUES
('Drink Cappuccino','☕','yellow','The-Famous-Focus','daily',2,true,'timer',120,v_ts,true),
('Go to Gym','🏃','yellow','The-Famous-Focus','daily',5,true,'timer',300,v_ts+1,true),
('Breakfast','🍳','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+2,true),
('Walk dog','🐕','yellow','The-Famous-Focus','daily',20,true,'timer',1200,v_ts+3,true),
('Read 5 inspirational cards','📖','yellow','The-Famous-Focus','daily',2,true,'timer',120,v_ts+4,true),
('Gratitude journal','🙏','yellow','The-Famous-Focus','daily',10,true,'timer',600,v_ts+5,true);
v_ts:=v_ts+6;

END $$;
