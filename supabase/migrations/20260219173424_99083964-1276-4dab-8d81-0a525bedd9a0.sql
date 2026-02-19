
-- Insert the ritual
INSERT INTO routines_bank (
  id, title, subtitle, description, category, emoji, color, is_active, is_popular, sort_order, schedule_type
) VALUES (
  'c1000001-0006-4000-a000-000000000001',
  'Rise & Shine: The 10-Minute Kickstart',
  'Start your day with clarity, energy, and intention—just 10 minutes!',
  '<p>This simple checklist is inspired by the bestselling book <strong>The Miracle Morning</strong>—a powerful method that has transformed the lives of millions by helping them start their day with intention, clarity, and energy. Simora turned its core ideas into a simple, daily check-in routine—easy to follow, easy to stick to.</p>

<ul>
<li>✨ Boost focus &amp; energy</li>
<li>🌱 Build strong, sustainable habits</li>
<li>📊 Track your progress, one day at a time</li>
</ul>

<p><strong>Try it for 7 days—feel the shift, own your morning, change your life.</strong></p>

<h2>Energy Reset Morning Routine</h2>
<p>Start your day with clarity, energy, and intention—just 10 minutes!</p>

<h2>1. Mood Check (1 min)</h2>
<p>Ask yourself: "How am I feeling this morning?"</p>
<ul>
<li>😄 Energized</li>
<li>😐 Neutral</li>
<li>😔 Tired or stressed</li>
</ul>
<p>→ Tap to log your mood and start building awareness.</p>

<h2>2. 1% Better Action (1 min)</h2>
<p>Choose one micro-win to complete today:</p>
<ul>
<li>📖 Read 1 page</li>
<li>🧘 Stretch for 3 minutes</li>
<li>🚶 Walk outside for 5 minutes</li>
<li>💧 Drink a full glass of water</li>
<li>✍️ Write 1 gratitude sentence</li>
</ul>
<p>→ Tiny steps = long-term progress.</p>

<h2>3. Energy Focus Intention (2 mins)</h2>
<p>Set your direction: "Where do I want my energy to go today?"</p>
<ul>
<li>🧠 Focus on 1 deep action</li>
<li>💬 Set boundaries with distractions</li>
<li>🌿 Protect my peace</li>
</ul>
<p>→ Write or select your focus from a list.</p>

<h2>4. Declutter One Thing (3 mins)</h2>
<p>Remove one small friction:</p>
<ul>
<li>🧹 Clean up a surface</li>
<li>📱 Delete an unused app</li>
<li>🧺 Put away laundry</li>
</ul>
<p>→ Clear space, clear mind.</p>

<h2>5. Affirmation or Reset Thought (3 mins)</h2>
<p>Say or write one energizing line:</p>
<ul>
<li>"Progress, not perfection."</li>
<li>"I give myself space to grow."</li>
<li>"I choose calm and clarity."</li>
</ul>
<p>→ Start with intention. End with belief.</p>

<h2>🎉 You''re Done! Congratulations!</h2>',
  'MorningRoutines',
  '🌅',
  'peach',
  true,
  false,
  6,
  'daily'
);

-- Insert the main daily action
INSERT INTO routines_bank_tasks (
  id, routine_id, title, emoji, section_id, section_title, task_order, schedule_days
) VALUES (
  gen_random_uuid(),
  'c1000001-0006-4000-a000-000000000001',
  'Energy Reset Morning Routine',
  '⚡',
  NULL,
  NULL,
  0,
  NULL
);
