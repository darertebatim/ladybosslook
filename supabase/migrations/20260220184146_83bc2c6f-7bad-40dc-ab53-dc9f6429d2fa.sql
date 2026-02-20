
-- Insert Ritual 1: Beat the Cramps
INSERT INTO routines_bank (
  id, title, description, category, emoji, color, is_active, is_popular, sort_order, schedule_type, end_mode, requires_subscription, is_free
) VALUES (
  gen_random_uuid(),
  'Beat the Cramps: Your Self-Care Ritual for a Pain-Free Period',
  '<h2>Are You Tired of Dealing With Period Cramps Every Month?</h2>
<p>Looking for effective ways to ease the discomfort and improve your quality of life? This self-care ritual is designed to help you prevent and manage period cramps through healthy habits and natural remedies.</p>

<h2>Before Your Period</h2>
<ul>
<li>Exercise regularly (i.e. yoga, swimming, walking).</li>
<li>Take supplements (Include vitamin E, omega-3, vitamin B1, vitamin B6, and magnesium).</li>
<li>Practice mindfulness (i.e. meditation, deep breathing exercises).</li>
<li>Eat anti-inflammatory foods (i.e. berries, fatty fish, leafy greens, nuts, seeds).</li>
<li>Maintain a healthy diet (i.e. reduce intake of caffeine, alcohol, and salty food).</li>
<li>Get adequate sleep.</li>
</ul>

<h2>During Your Period</h2>
<ul>
<li>Stay hydrated (i.e. water, herbal tea).</li>
<li>Apply heat (i.e. use a heating pad, take a warm bath).</li>
<li>Wear comfortable clothing.</li>
<li>Practice gentle stretching.</li>
<li>Try massage therapy.</li>
<li>Take pain relievers.</li>
<li>Consult a doctor when needed.</li>
</ul>

<h2>Why This Ritual Works</h2>
<ul>
<li><strong>Promotes Consistent Healthy Habits:</strong> Regular exercise and a balanced diet help maintain overall well-being and reduce menstrual discomfort.</li>
<li><strong>Reduces Inflammation:</strong> Incorporating anti-inflammatory foods and supplements like omega-3 fatty acids and magnesium helps to minimize pain and swelling.</li>
<li><strong>Enhances Blood Circulation:</strong> Physical activity and massage therapy improve blood flow, reducing the severity of cramps.</li>
</ul>

<p>Give it a try and see the difference it can make in your monthly cycle. Embrace these self-care practices to enjoy a healthier, more comfortable period.</p>',
  'HealthHub',
  '🩸',
  'pink',
  true,
  false,
  7,
  'ongoing',
  'never',
  false,
  true
);
