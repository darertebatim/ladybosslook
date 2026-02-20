
-- Ritual 1: 6 Parenting Tips
DO $$
DECLARE
  r1_id uuid := gen_random_uuid();
  r2_id uuid := gen_random_uuid();
  r3_id uuid := gen_random_uuid();
BEGIN

INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r1_id,
  '6 Parenting Tips that Help You Master the Morning Chaos',
  'By Alex Tyler, PhD, Developmental Psychology',
  '<p><strong>By Alex Tyler, PhD, Developmental Psychology</strong></p><p>Summer is over, and school is back in session. Once again, it''s time for parents to adjust their schedules and get their children ready for the school ritual. However, mornings can often be challenging, with the first trouble being getting your kids off to a good start.</p><p><strong>Create a Ritual Together:</strong> Children generally prefer to be involved in the decision-making process rather than always being told what to do. When they have choices and a say in their daily rituals, they are more likely to cooperate. Allow your children to have a say in deciding what happens each morning.</p><p><strong>Make Sure Your Child Understands:</strong> Sometimes, children resist following a ritual simply because they don''t understand it or don''t know how to. Be clear about the order of actions and their respective timeframes. Break down each part of the ritual and provide specific directions for each action.</p><p><strong>Rehearse to See If It Works:</strong> Do a trial run when you have extra time to see how long each action takes. Encourage your child to practice making their bed, getting dressed, having breakfast, and preparing their belongings on weekends.</p><p><strong>Beat the Buzzer!:</strong> To motivate them, try using a game and rewards. Set a timer in the morning and let your child know that it''s up to them to finish their actions before the timer goes off. Offer positive affirmations for their independence.</p><p><strong>Encourage Independence:</strong> Throughout the morning ritual, encourage your child to take responsibility for their own actions. Start by having your child choose their clothes for the week on Sunday and teach them to get themselves ready in the morning.</p><p><strong>Feed Right:</strong> Fuel your child with the right foods to support concentration. Research suggests that eating breakfast consistently leads to better nutritional profiles and improved cognitive function, including memory and test scores. For a nutritious breakfast, provide your child with a variety of foods, including high-fiber whole grains, fruits, and dairy products.</p><p><em>"Having a clear structure in place gives your child a sense of trust, safety and security" — Dr. Fran Walfish, Family Psychotherapist</em></p>',
  'HealthHub',
  '👨‍👩‍👧',
  '#4A90D9',
  'challenge',
  true,
  false,
  50,
  'never'
);

INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r1_id, 'Discuss the actions with your child', '🗣️', 1, ARRAY[1,2,3,4,5], false),
  (gen_random_uuid(), r1_id, 'Say positive affirmation', '💬', 2, ARRAY[1,2,3,4,5], false),
  (gen_random_uuid(), r1_id, 'Beat the buzzer', '⏰', 3, ARRAY[1,2,3,4,5], false),
  (gen_random_uuid(), r1_id, 'Eat a nutritious breakfast', '🍳', 4, ARRAY[1,2,3,4,5], false),
  (gen_random_uuid(), r1_id, 'Check the school bag', '🎒', 5, ARRAY[1,2,3,4,5], false),
  (gen_random_uuid(), r1_id, 'Go to school', '🏫', 6, ARRAY[1,2,3,4,5], false);

-- Ritual 2: 10 Wholesome Habits During Periods
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r2_id,
  '10 Wholesome Habits to Adopt During Periods',
  'By Debra Minjarez, MD, Gynecology and Women''s Health Research',
  '<p><strong>By Debra Minjarez, MD, Gynecology and Women''s Health Research</strong></p><p>Feel no more! Get ready to embrace your femininity and feel like a superwoman because we have a wholesome period ritual that will help you do just that!</p><p>🔥 <strong>Tired Of Cramps? Use Heating Pads:</strong> Heating pads really are a blessing in disguise for people who experience intense period pain. They are easy to use, super comfortable and safe, and most importantly, very effective!</p><p>🚿 <strong>Stay Clean:</strong> It''s best to use a mild body wash to ensure physical cleanliness. Remember, a clean body = a happy body!</p><p>🕯️ <strong>Try Aromatherapy For Mood Uplifting:</strong> A very common symptom of PMS is mood swings and irritability. Aromatherapy works wonders for mood uplifting. Make essential oils and scented candles a constant part of your environment during your period.</p><p>🧘 <strong>Practice Meditation:</strong> Another way of eliminating mood swings besides aromatherapy is practicing meditation. Yoga, mindfulness, heavy breathing, mindful walking — all of these meditation techniques can bring a huge change in your mental health before and during your period.</p><p>☀️ <strong>Take Enough Vitamin D And Calcium:</strong> During menstruation, it''s crucial to consume sufficient Vitamin D and calcium for optimal reproductive health.</p><p>🥩 <strong>Increase Iron Intake:</strong> During periods, women lose blood, which leads to a temporary decrease in iron stores. For iron, you can have red meat, fish, prawns, tofu, nuts and more.</p><p>🥚 <strong>Consume Enough Protein Weekly:</strong> Remember to maintain your protein intake during your period — it''s essential for health and energy and key in easing muscle cramps.</p><p>📚 <strong>Read Enjoyable Books:</strong> Reading enjoyable books like fiction novels, drama, sci-fi, etc., can help give you the distraction that you so desperately need.</p><p>🤸 <strong>Do Static Stretching:</strong> Static stretching helps with physical recovery during and after your period.</p><p>💆 <strong>Get A Relaxing Massage:</strong> It''s also advisable to get a relaxing massage every week to make your body feel refreshed and relaxed during your period.</p>',
  'HealthHub',
  '🌸',
  '#E91E8C',
  'challenge',
  true,
  false,
  51,
  'never'
);

-- Daily tasks (all days 0-6)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Use a heating pad to relieve cramps', '🔥', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Use mild body wash to clean body', '🚿', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Aromatherapy', '🕯️', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Meditate', '🧘', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Take enough calcium and vitamin D', '☀️', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Increase iron intake', '🥩', 6, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Protein intake', '🥚', 7, ARRAY[0], false),
  (gen_random_uuid(), r2_id, 'Trim nails', '💅', 8, ARRAY[1], false),
  (gen_random_uuid(), r2_id, 'Read enjoyable books', '📚', 9, ARRAY[3], false),
  (gen_random_uuid(), r2_id, 'Do static stretching', '🤸', 10, ARRAY[5], false),
  (gen_random_uuid(), r2_id, 'Body massage', '💆', 11, ARRAY[6], false);

-- Ritual 3: Switch Your Lifestyle to an Immune Booster
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r3_id,
  'Switch Your Lifestyle to an Immune Booster',
  'By Debra Minjarez, MD, Gynecology and Women''s Health Research',
  '<p><strong>By Debra Minjarez, MD, Gynecology and Women''s Health Research</strong></p><p>In a world where we all lead a sedentary lifestyle, it is obvious that people adopt effective measures to stay healthy. This essay sheds light on how women can improve their immunity.</p><p>🥗 <strong>Eat a well-balanced diet:</strong> Consuming fruits, vegetables, and protein-rich grains like brown rice and quinoa boosts your immunity. These foods are packed with antioxidants and may lower the risk of chronic inflammatory diseases. The Mediterranean diet is a great example.</p><p>🍶 <strong>Eat foods with probiotics:</strong> Add probiotics to your diet through foods like cottage cheese, yogurt, tofu, and green tea. Beyond boosting immunity, probiotics improve gut health, prevent cancer, relieve allergies, and reduce inflammation.</p><p>🚫🍬 <strong>Ditch sugar:</strong> Excessive sugar intake harms beneficial gut bacteria and weakens the immune system. Cutting out sugary products from your diet can lead to positive changes.</p><p>🌿 <strong>Add spices to your meals:</strong> Spice up meals with ginger, garlic, turmeric, cinnamon, and thyme for flavor and health perks like anti-inflammatory, antifungal properties.</p><p>💊 <strong>Go for supportive supplements:</strong> Take supplements like Selenium, Vitamin D3, Vitamin C, Vitamin E, Zinc, fish oil, etc. Zinc is called the "gatekeeper" of your immune system because it makes all your immune cells function properly.</p><p>🚭 <strong>Say no to Alcohol and Smoking:</strong> Alcohol and smoking can impair your immune system. Smoking leads to profound transformations within the immune system characterized by mixed inflammation and immunosuppression.</p><p>🚶 <strong>Exercise regularly:</strong> Exercising regularly, like 30 minutes three times a week, can boost immunity and prevent diseases. Exercise facilitates more rapid circulation of antibodies and white blood cells.</p><p>😴 <strong>Take adequate sleep:</strong> Sleeping for 7 to 8 hours a night will allow your body to rest and refresh. Research suggests that sleep strengthens immune memory.</p><p>🧘 <strong>Try to minimize stress:</strong> Consistent yoga practice can decrease stress levels, reducing inflammation. Yoga''s deep breathing enhances immunity, while inverted poses assist lymphatic fluid circulation.</p><p><em>Ladies! You deserve to stay healthy, and your family is nothing without you.</em></p>',
  'HealthHub',
  '🛡️',
  '#4CAF50',
  'challenge',
  true,
  false,
  52,
  'never'
);

-- Daily tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r3_id, 'Fruit and veggies', '🥗', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Eat foods with probiotics', '🍶', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Limit sugar', '🚫', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Add spices to meals', '🌿', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Supportive supplements', '💊', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Walks', '🚶', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'No Alcohol', '🚫🍺', 7, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'No smoke', '🚭', 8, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r3_id, 'Get enough sleep', '😴', 9, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly tasks
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r3_id, 'Bicycle', '🚴', 10, ARRAY[0,2], false),
  (gen_random_uuid(), r3_id, 'Yoga', '🧘', 11, ARRAY[1,3], false),
  (gen_random_uuid(), r3_id, 'Meditate', '🧠', 12, ARRAY[1,3], false);

-- Monthly task (7th of month)
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, monthly_day, is_once)
VALUES
  (gen_random_uuid(), r3_id, 'Play golf', '⛳', 13, NULL, 7, false);

END $$;
