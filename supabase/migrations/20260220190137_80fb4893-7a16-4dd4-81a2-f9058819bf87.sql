
DO $$
DECLARE
  r1_id uuid := gen_random_uuid();
  r2_id uuid := gen_random_uuid();
  r3_id uuid := gen_random_uuid();
  r4_id uuid := gen_random_uuid();
  r5_id uuid := gen_random_uuid();
BEGIN

-- Ritual 1: School Morning Ritual for Busy Moms
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r1_id,
  'School Morning Ritual for Busy Moms',
  'Mornings don''t have to be rushed and stressful',
  '<p>Mornings don''t have to be rushed and stressful. This streamlined before-school Ritual keeps things smooth and organized, helping both you and your kids start the day with calm and confidence.</p>
<p>🤗 <strong>Wake Up & Gentle Start:</strong> Start the day with a gentle wake-up. Give yourself and the kids a few moments for snuggles or a brief cuddle to ease into the morning before the rush begins.</p>
<p>🍳 <strong>Healthy Breakfast:</strong> Serve a quick, nutritious breakfast like eggs, oatmeal, or yogurt with fruit. This gives your kids the fuel they need while you take a few minutes to prep for the next steps.</p>
<p>👕 <strong>Get Dressed:</strong> Have your kids dress in clothes laid out the night before. This eliminates decision-making stress and saves precious time. Ensure shoes and jackets are within easy reach.</p>
<p>🥪 <strong>Pack Lunches:</strong> If you haven''t already packed lunches the night before, now''s the time. Keep it simple with healthy, easy-to-assemble options, and involve the kids by letting them choose a snack.</p>
<p>🎒 <strong>Final Bag Check:</strong> Do a quick once-over of school bags to ensure everything is packed: homework, books, lunchboxes, and supplies. This step avoids any last-minute scrambles.</p>
<p>🦷 <strong>Teeth & Hair:</strong> After breakfast, guide the kids through brushing their teeth and fixing their hair. This keeps everyone feeling fresh and prepared for the day ahead.</p>
<p>✨ <strong>Quick Moment of Positivity:</strong> Take 30 seconds to share a positive thought or encouragement, or ask your kids what they''re looking forward to today. This little boost can make a big difference in their mood.</p>
<p>🚪 <strong>Smooth Exit:</strong> Grab coats, bags, and lunches, and head out the door with time to spare. Leaving calmly without rushing makes for a more peaceful start to the day for everyone.</p>',
  'FamilyParenting',
  '🌅',
  '#FF9800',
  'challenge',
  true,
  false,
  10,
  'never'
);

INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r1_id, 'Wake up & gentle start', '🤗', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Healthy breakfast', '🍳', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Get dressed', '👕', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Pack lunches', '🥪', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Final bag check', '🎒', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Teeth & hair', '🦷', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Quick moment of positivity', '✨', 7, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Smooth exit', '🚪', 8, ARRAY[0,1,2,3,4,5,6], false);

-- Ritual 2: Children's Room Cleaning Ritual
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r2_id,
  'Children''s Room Cleaning Ritual for a Tidy and Fun Space',
  'Keeping a children''s room clean doesn''t have to be overwhelming',
  '<p>Keeping a children''s room clean doesn''t have to be overwhelming! With a few simple habits and regular Actions, you can maintain a tidy, organized space where your child can play, learn, and rest.</p>
<p>🧸 <strong>Tidy Up Toys:</strong> Encourage your child to help pick up toys at the end of each day. Use bins, baskets, or shelves to store toys in designated areas, keeping the room clutter-free.</p>
<p>🛏️ <strong>Make the Bed:</strong> Start each day by making the bed. It''s a quick and simple way to make the room look tidier and more organized instantly.</p>
<p>🧹 <strong>Dust and Wipe Surfaces:</strong> Once a week, dust furniture, shelves, and other surfaces. Wipe down frequently touched areas, such as desks, door handles, and light switches.</p>
<p>🧹 <strong>Vacuum or Sweep the Floor:</strong> Vacuum or sweep the floor weekly to remove dirt, dust, and crumbs. If the room has a rug, make sure to vacuum it as well.</p>
<p>👗 <strong>Organize Clothes and Closets:</strong> Go through your child''s clothes once a month, organizing them by type and size. Donate or store outgrown clothes.</p>
<p>📚 <strong>Declutter Toys and Books:</strong> Sort through toys and books monthly, removing items that are no longer used or broken. Donate what''s in good condition.</p>
<p>🧽 <strong>Deep Clean:</strong> Every three months, do a thorough cleaning of the entire room. Clean windows, baseboards, and wipe down walls if needed.</p>
<p>By following this Ritual, you can ensure the children''s room remains a clean and inviting place for both playtime and rest.</p>',
  'FamilyParenting',
  '🧸',
  '#4CAF50',
  'challenge',
  true,
  false,
  11,
  'never'
);

-- Daily tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Tidy up toys', '🧸', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Make the bed', '🛏️', 2, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Dust and wipe surfaces', '🧹', 3, ARRAY[1], false),
  (gen_random_uuid(), r2_id, 'Vacuum and sweep the floor', '🧹', 4, ARRAY[4], false);

-- Monthly tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, monthly_day, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Organize clothes and closets', '👗', 5, 1, NULL, false),
  (gen_random_uuid(), r2_id, 'Declutter toys and books', '📚', 6, 8, NULL, false),
  (gen_random_uuid(), r2_id, 'Deep clean', '🧽', 7, 15, NULL, false);

-- Ritual 3: Essential Dental Hygiene Ritual for Kids
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r3_id,
  'Essential Dental Hygiene Ritual for Kids',
  'Establishing a good dental hygiene Ritual from an early age',
  '<p>Establishing a good dental hygiene Ritual from an early age is important for maintaining healthy teeth and gums as kids grow. By following these simple steps, you can help your child prevent cavities and ensure their mouth stays clean and healthy.</p>
<p>🦷 <strong>Tooth Brushing:</strong> Help your child brush their teeth twice a day — once in the morning and once before bed. Use a soft-bristled toothbrush and make sure they brush for at least two minutes. Teach them to use gentle circular motions, focusing on all surfaces of their teeth and gums.</p>
<p>🪥 <strong>Flossing:</strong> Assist your child with flossing twice a day after brushing. Flossing removes plaque and food particles between teeth that brushing alone can''t reach, helping prevent cavities and gum disease.</p>
<p>🏥 <strong>Dental Visit:</strong> Schedule a dental check-up for your child every 6 months. Regular visits to the dentist will ensure their teeth are developing properly and any issues can be caught early.</p>',
  'FamilyParenting',
  '🦷',
  '#03A9F4',
  'challenge',
  true,
  false,
  12,
  'never'
);

-- Daily tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r3_id, 'Tooth brushing (Morning)', '🦷', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Flossing (Morning)', '🪥', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Tooth brushing (Evening)', '🦷', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Flossing (Evening)', '🪥', 4, ARRAY[0,1,2,3,4,5,6], false);

-- Monthly task
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, monthly_day, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r3_id, 'Dental visit', '🏥', 5, 1, NULL, false);

-- Ritual 4: Weekend Family Ritual with Children
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r4_id,
  'Weekend Family Ritual with Children',
  'Weekends are precious opportunities to reconnect with loved ones',
  '<p>Weekends are precious opportunities to reconnect with loved ones, and what better way than creating a fun and enriching Ritual for the whole family?</p>
<p>🥞 <strong>Family Breakfast:</strong> Ditch the cereal Ritual and whip up a special breakfast together. Pancakes, waffles, or even smoothies — let your creativity flow! This fosters teamwork, laughter, and sets the tone for a positive day.</p>
<p>🚴 <strong>Outdoor Activity:</strong> Get active and soak up the sun! Visit a park, go for a bike ride, explore a nature trail, or have a backyard picnic. Fresh air, exercise, and shared experiences create lasting memories.</p>
<p>🎨 <strong>Creative Time:</strong> Unleash your artistic talents! Paint, draw, write stories, build forts, or play board games for at least 1 hour each day. Encourage free expression and celebrate each other''s unique ways of thinking.</p>
<p>📚 <strong>Learning Time:</strong> Spark curiosity with age-appropriate activities. Visit a museum, explore a historical site, read educational books together, or conduct a backyard science experiment. Devote at least 1 hour to this activity every weekend day.</p>
<p>👨‍🍳 <strong>Cook a Meal:</strong> Turn the kitchen into a family bonding zone! Choose a recipe everyone enjoys, assign Actions, and work together to create a delicious feast.</p>
<p>🍽️ <strong>Eat Together:</strong> Savor the delicious meal you prepared and use this time to share stories, jokes, and highlights of your day. Unplug from electronics and truly connect as a family.</p>
<p>💬 <strong>Sharing Day''s Highlights:</strong> Encourage each family member to share their favorite moments from the day. This fosters communication, empathy, and creates a safe space for everyone to be heard.</p>
<p>📖 <strong>Bedtime Stories:</strong> Cozy up together and unwind with captivating stories. It''s a calming way to end the day, strengthen bonds, and create cherished memories that will last a lifetime.</p>
<p><em>Tip: Encourage everyone to participate in creating the weekend Ritual. Involve your children in brainstorming activities, assigning Actions, and making adjustments.</em></p>',
  'FamilyParenting',
  '👨‍👩‍👧',
  '#E91E63',
  'challenge',
  true,
  false,
  13,
  'never'
);

-- Weekly tasks (weekends: Sat=6, Sun=0)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r4_id, 'Family breakfast', '🥞', 1, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Outdoor activity', '🚴', 2, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Creative time', '🎨', 3, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Learning time', '📚', 4, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Cook a meal', '👨‍🍳', 5, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Eat together', '🍽️', 6, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Sharing day''s highlights', '💬', 7, ARRAY[0,6], false),
  (gen_random_uuid(), r4_id, 'Bedtime stories', '📖', 8, ARRAY[0,6], false);

-- Ritual 5: Stress-Free After-School Ritual for Moms
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r5_id,
  'Stress-Free After-School Ritual for Moms',
  'Create structure, support your kids, and carve out moments of connection',
  '<p>After school can be a busy and sometimes chaotic time for moms. This Ritual is designed to help you create structure, support your kids, and carve out moments of connection and relaxation.</p>
<p>🏠 <strong>Welcome Home & Snack Time:</strong> When the kids get home, greet them warmly and ask about their day. Settle them in with a healthy snack — something simple like apple slices with peanut butter or yogurt and fruit.</p>
<p>💬 <strong>Check-In and Unwind:</strong> Sit down with your kids for a quick chat about their day. Ask open-ended questions like, "What was the best part of your day?" This allows them to share while creating a calm transition from school to home.</p>
<p>📚 <strong>Homework or Quiet Activity Time:</strong> Dedicate some time for your kids to work on homework or a quiet activity. Set up a peaceful space for them to focus, and offer assistance when needed.</p>
<p>🧹 <strong>Quick Tidy-Up Together:</strong> Before dinner, take 10–15 minutes to do a quick tidy-up as a team. Involve your kids by asking them to help with simple Actions like putting away toys or setting the table.</p>
<p>🍽️ <strong>Family Dinner Preparation:</strong> Involve the kids in dinner prep — whether it''s setting the table, washing veggies, or stirring a pot. This not only eases your load but creates a sense of teamwork.</p>
<p>🥗 <strong>Eat Dinner Together:</strong> Enjoy a family meal together. Try to make this time screen-free, focusing on connecting and talking about your day.</p>
<p>🏃 <strong>Playtime or Outdoor Time:</strong> After dinner, spend some quality playtime with the kids. If the weather is nice, head outside for a walk, play in the yard, or ride bikes.</p>
<p>🌙 <strong>Wind Down with a Calming Bedtime Ritual & Gratitude:</strong> Start winding down with a calming bedtime Ritual like brushing teeth and reading a story together. Before bed, let them share what they''re grateful for.</p>
<p>☕ <strong>Mom''s Time for Self-Care:</strong> Once the kids are in bed, take a little time for yourself. Whether it''s a cup of tea, a bath, or a chapter of a book, make sure to unwind and recharge.</p>',
  'FamilyParenting',
  '🏠',
  '#9C27B0',
  'challenge',
  true,
  false,
  14,
  'never'
);

INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r5_id, 'Welcome home & snack time', '🏠', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Check-in & unwind', '💬', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Homework & quiet activity time', '📚', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Quick tidy up together', '🧹', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Family dinner preparation', '🍽️', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Eat dinner together', '🥗', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Playtime or outdoor time', '🏃', 7, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Wind down with a calming bedtime Ritual', '🌙', 8, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r5_id, 'Mom''s time for self-care', '☕', 9, ARRAY[0,1,2,3,4,5,6], false);

END $$;
