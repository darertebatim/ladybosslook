
-- Insert Ritual 1: Rituals to Boost Happiness Hormones
INSERT INTO routines_bank (id, title, subtitle, description, category, color, emoji, is_active, is_popular, sort_order, schedule_type, is_free)
VALUES 
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Rituals to Boost Happiness Hormones', 'Boost your mood with simple daily habits', 
   '<p>Each of us possesses four "happiness hormones" in our bodies: serotonin, dopamine, endorphins, and oxytocin. These hormones play a crucial role in regulating our mood and overall well-being. By increasing the levels of these hormones through simple Rituals, we can maintain a positive emotional state consistently. Here are the Rituals to enhance your happiness!</p>

<p>How are you feeling today? Go to the Tools page to record your mood!</p>

<h2>😐 Serotonin: The Mood Stabilizer Boosting Ritual</h2>
<ul>
<li>Expose yourself to sunlight</li>
<li>Walk in nature</li>
<li>Journal daily</li>
</ul>

<h2>🎵 Dopamine: The Happy Hormone Boosting Ritual</h2>
<ul>
<li>Listen to music</li>
<li>Engage in self-care activities (i.e. meditation)</li>
<li>Learn new skills</li>
</ul>

<h2>🏔️ Endorphins: The Natural Pain Reliever Boosting Ritual</h2>
<ul>
<li>Exercise regularly</li>
<li>Watch a comedy movie</li>
<li>Create art (i.e. drawing)</li>
</ul>

<h2>🐈 Oxytocin: The Love Hormone Boosting Ritual</h2>
<ul>
<li>Show physical affection</li>
<li>Perform acts of kindness (i.e. volunteer in the community)</li>
<li>Interact with pets</li>
</ul>

<h2>🤔 Why This Ritual Works</h2>
<ul>
<li><strong>Simplicity:</strong> These Rituals are simple and easy to incorporate into your daily life.</li>
<li><strong>Consistency:</strong> By consistently engaging in these activities, you can gradually increase the levels of happiness hormones in your body.</li>
<li><strong>Natural:</strong> The Rituals focus on natural activities that are known to boost mood and well-being.</li>
<li><strong>Balance:</strong> Each happiness hormone has a corresponding Ritual to ensure a holistic approach to promoting emotional health.</li>
</ul>

<p>Try these simple Rituals to improve your mood and overall well-being! Start small, build gradually, and discover what works best for you. Happiness is within reach—unlock it with these habits!</p>',
   'HealthyLifeStyle', 'yellow', '😊', true, false, 1, 'daily', true);

-- Insert Ritual 2: Secrets To A Fantastic Working Mom's Ritual
INSERT INTO routines_bank (id, title, subtitle, description, category, color, emoji, is_active, is_popular, sort_order, schedule_type, is_free)
VALUES 
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Secrets To A Fantastic Working Mom''s Ritual', 'Balance career and family with simple daily habits',
   '<p>Are you a working mom struggling to balance your career and family responsibilities? The key to a successful Ritual lies in a few simple habits that can make all the difference. From starting your day with a healthy breakfast to making time for yourself in the evening, discover the secrets to a fantastic working mom''s Ritual.</p>

<h2>Morning:</h2>
<ul>
<li>⏰ <strong>Rise and shine:</strong> Starting your day early can give you more time to get things done and reduce stress.</li>
<li>🍳 <strong>Healthy breakfast:</strong> Eating a nutritious breakfast can give you energy and help you focus throughout the day.</li>
<li>🎒 <strong>Pack a bag:</strong> Being organized and prepared can make your morning Ritual smoother and less chaotic.</li>
<li>👶 <strong>Drop kids off at daycare:</strong> Finding a reliable and safe daycare can give you peace of mind while you''re at work.</li>
<li>💼 <strong>Go to work:</strong> Pursuing your career goals and staying engaged in your profession can boost your self-esteem and sense of purpose.</li>
</ul>

<h2>Noon:</h2>
<ul>
<li><strong>Make lunch:</strong> Preparing your own lunch can save you money and help you make healthier food choices.</li>
<li><strong>Take a nap:</strong> Taking a short nap can improve your productivity and help you feel refreshed and alert.</li>
</ul>

<h2>Evening:</h2>
<ul>
<li>👤 <strong>Pick kids up:</strong> Spending time with your children and staying involved in their lives can strengthen your family bonds.</li>
<li>🍲 <strong>Cook dinner:</strong> Preparing a home-cooked meal can be a healthy and enjoyable way to bond with your family.</li>
<li>💗 <strong>Family walk:</strong> Going for a walk together can be a fun and healthy way to spend time as a family and get some exercise.</li>
<li>🧹 <strong>Clean up:</strong> Keeping your home tidy and organized can reduce stress and create a more peaceful environment.</li>
<li>😊 <strong>Me time:</strong> Taking some time for yourself to pursue hobbies, relax, or socialize can help you recharge and maintain a healthy work-life balance.</li>
</ul>

<p>That''s the end of a happy and orderly day! I believe that through this Ritual, you will become a mom who can balance your career and family well!</p>',
   'HealthyLifeStyle', 'peach', '👩‍💼', true, false, 2, 'daily', true);

-- Ritual 1 Tasks: Daily (6), Weekly (5), Monthly (1)
INSERT INTO routines_bank_tasks (routine_id, title, emoji, task_order, schedule_days, drip_day) VALUES
  -- Daily
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Expose yourself to sunlight', '☀️', 1, NULL, NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Journal daily', '📝', 2, NULL, NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Listen to music', '🎵', 3, NULL, NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Exercise regularly', '🏃', 4, NULL, NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Show physical affection', '🤗', 5, NULL, NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Interact with pets', '🐈', 6, NULL, NULL),
  -- Weekly
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Walk in nature', '🌿', 7, '{6}', NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Engage in self-care activities', '🧘', 8, '{1}', NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Learn new skills', '📚', 9, '{5}', NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Create art', '🎨', 10, '{3}', NULL),
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Perform acts of kindness', '💝', 11, '{6}', NULL),
  -- Monthly (use drip_day=15 to represent 15th of month)
  ('a1b2c3d4-1111-4000-8000-000000000001', 'Watch a comedy movie', '🎬', 12, NULL, NULL);

-- Ritual 2 Tasks: All Daily (12 tasks)
INSERT INTO routines_bank_tasks (routine_id, title, emoji, task_order, schedule_days, drip_day) VALUES
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Rise and shine', '⏰', 1, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Eat a nutritious breakfast', '🍳', 2, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Pack a bag', '🎒', 3, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Drop kids off at daycare', '👶', 4, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Go to work', '💼', 5, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Make lunch', '🥗', 6, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Take a nap', '😴', 7, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Pick kids up', '👤', 8, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Cook dinner', '🍲', 9, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Family walk', '💗', 10, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Clean up', '🧹', 11, NULL, NULL),
  ('a1b2c3d4-2222-4000-8000-000000000002', 'Me time', '😊', 12, NULL, NULL);
