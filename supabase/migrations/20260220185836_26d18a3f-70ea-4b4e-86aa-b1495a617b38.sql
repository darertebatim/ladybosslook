
DO $$
DECLARE
  r1_id uuid := gen_random_uuid();
  r2_id uuid := gen_random_uuid();
BEGIN

-- Ritual 1: Accepting and Loving Yourself with ADHD
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r1_id,
  'Accepting and Loving Yourself with ADHD',
  'By Juergen Schmutz, PhD in Psychology',
  '<p><strong>By Juergen Schmutz, PhD in Psychology, cognitive-behavioral therapy and ADHD treatment</strong></p>
<p>We all experience ups and downs, correct? However, living with ADHD may occasionally intensify these feelings, making it challenging to maintain your concentration or avoid distractions. Rest assured, experiencing such challenges is perfectly normal.</p>
<h3>Housewives with ADHD</h3>
<p>Women and girls with ADHD often "mask" their symptoms due to social expectations for order and composure. Five simple tricks can help stay on target with self-directed plans at home:</p>
<p><strong>i. Brain dump:</strong> Overwhelmed by numerous actions? Write them down to focus better.</p>
<p><strong>ii. Fixed start action:</strong> Start daunting chores with a consistent action to avoid fatigue and show progress.</p>
<p><strong>iii. Pre-night planning:</strong> Plan the top 3 actions for the next day the night before. Review your calendar and start your day with a ready list for better focus and productivity.</p>
<p><strong>iv. Timer usage:</strong> Use a timer for continuous actions to signal a reachable end and inspire hope and momentum.</p>
<p><strong>v. Accountability friends:</strong> For women with ADHD, friends who care about your goals can boost motivation and determination.</p>
<h3>A Professional Lady with ADHD</h3>
<p>ADHD affects women''s lives including education, work and relationships. Women with ADHD must embrace it compassionately, finding a space to freely express their creativity and energy without apologies. Tips for finding the perfect fit:</p>
<p><strong>i.</strong> Use career tests to match talents and interests for job satisfaction and performance.</p>
<p><strong>ii.</strong> Embrace your ADHD. Your unique problem-solving, energy, persistence, creativity, and spontaneity are assets.</p>
<p><strong>iii.</strong> Manage time and organization with regular check-ins, external accountability, and scheduled intermediate deadlines.</p>
<p><strong>iv.</strong> Engage in professional psychological support. Peer-to-peer assistance and Mental Health Champions provide proactive workplace support.</p>
<h3>How to Relax After an ADHD Diagnosis</h3>
<p><strong>i. Deep Breathing:</strong> Focusing on deep breathing helps clear your mind and provides clarity.</p>
<p><strong>ii. Journaling:</strong> Writing your thoughts on paper gives your persona a chance to loosen up by venting out stress.</p>
<p><strong>iii. Meditation:</strong> A well-known practice to relax your mind, taking it off external stress and reflecting on your feelings.</p>
<p><strong>iv. Maintaining Boundaries:</strong> Reevaluate your life''s borders to help retrieve your peace of mind.</p>
<p><strong>v. Exercise:</strong> Exercise is an excellent way to pull our minds away from stress through jogging, push-ups, and stretches.</p>',
  'HealthHub',
  '🧠',
  '#9C27B0',
  'challenge',
  true,
  false,
  53,
  'never'
);

-- Daily tasks for Ritual 1
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r1_id, 'Start with a brain dump', '🧠', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Set a go-to start action', '🎯', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Plan the day before the night', '📋', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Use a timer', '⏱️', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Schedule frequent check-ins', '📅', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Taking exercise a priority', '🏃', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r1_id, 'Have a set bedtime', '🛌', 7, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly tasks for Ritual 1
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r1_id, 'Create external accountability', '🤝', 8, ARRAY[0], false),
  (gen_random_uuid(), r1_id, 'Participate in professional support', '💼', 9, ARRAY[1], false),
  (gen_random_uuid(), r1_id, 'Find a friend for accountability', '👥', 10, ARRAY[2], false),
  (gen_random_uuid(), r1_id, 'Create intermediate deadlines', '📌', 11, ARRAY[3], false),
  (gen_random_uuid(), r1_id, 'Create rewards', '🎁', 12, ARRAY[5], false),
  (gen_random_uuid(), r1_id, 'Focus on the future', '🔭', 13, ARRAY[6], false);

-- Ritual 2: Burned-out Stay-at-Home Moms: Time for Self-Care
INSERT INTO routines_bank (id, title, subtitle, description, category, emoji, color, schedule_type, is_active, is_popular, sort_order, end_mode)
VALUES (
  r2_id,
  'Burned-out Stay-at-Home Moms: Time for Self-Care',
  'By Debra Minjarez, MD, Gynecology and Women''s Health Research',
  '<p><strong>By Debra Minjarez, MD, Gynecology and Women''s Health Research</strong></p>
<h3>How Bad is Burnout?</h3>
<p>According to Motherly''s 2022 State of Motherhood Survey, millennial and Gen Z SAHMs are feeling "more worn down than ever". 55% reported they "always" or "frequently" feel burnt out. Parental burnout is damaging to both the caregiver and other family members.</p>
<h3>Are You Sure You Are Fine?</h3>
<p>Check the 4 core symptoms of caregiver burnout:</p>
<ul>
<li>Emotional exhaustion (e.g., I feel completely run down by my role as a parent)</li>
<li>Contrast with previous parental self (e.g., I am no longer the parent I used to be)</li>
<li>Loss of pleasure in one''s parental role (e.g., I do not enjoy being with my children)</li>
<li>Emotional distancing from one''s children (e.g., I am no longer able to show my children that I love them)</li>
</ul>
<p>Recognition paves the way for recovery. Guilt is alleviated by self-acceptance; the next step is self-care.</p>
<h3>How to Manage — Give Yourself Breaks</h3>
<p>Try not to cram your days with chores. It is perfectly alright to take up some hobby: baking, learning an instrument, writing, learning a language, sewing, yoga, jogging, photography, or gardening. Even a minor break from time to time makes a difference.</p>
<h3>How to Manage — Talk it Out</h3>
<p>Understand that you''re not the only one having trouble juggling everything. Meeting friends and like-minded parents helps you build a supportive community. You will discover your value outside your home, and an enlarged social circle enhances the sense of confidence, security and empowerment.</p>
<h3>How to Manage — Involve Your Families</h3>
<p>Working out a cooperation plan with family members will not only ease your burden but may actually delight your families. Having an open discussion regarding household responsibilities can help establish a better balance between you and your partner.</p>
<h3>How to Manage — Improve Your Parenting Skills</h3>
<p>Daily time management steps:</p>
<ul>
<li>Stop multi-tasking, set priorities per day</li>
<li>Create a ritual</li>
<li>Delegate work</li>
<li>Use time blocking</li>
<li>Batch your errands</li>
<li>Audit and review your day</li>
</ul>',
  'HealthHub',
  '🏠',
  '#FF7043',
  'challenge',
  true,
  false,
  54,
  'never'
);

-- Daily tasks for Ritual 2
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Deep breathing', '🌬️', 1, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Yoga and aerobics', '🧘', 2, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Hang out with friend', '👯', 3, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Eat a nutritious breakfast', '🍳', 4, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Say positive affirmation', '💬', 5, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Looking for same hobby friends', '🔍', 6, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Family walk', '👨‍👩‍👧', 7, ARRAY[0,1,2,3,4,5,6], false),
  (gen_random_uuid(), r2_id, 'Skincare', '✨', 8, ARRAY[0,1,2,3,4,5,6], false);

-- Weekly tasks for Ritual 2
INSERT INTO routines_bank_tasks (id, routine_id, title, emoji, task_order, schedule_days, is_once)
VALUES
  (gen_random_uuid(), r2_id, 'Bicycle', '🚴', 9, ARRAY[0,2], false),
  (gen_random_uuid(), r2_id, 'Yoga', '🧘', 10, ARRAY[1,3], false),
  (gen_random_uuid(), r2_id, 'Meditate', '🧠', 11, ARRAY[1,3], false);

END $$;
