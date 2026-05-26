
-- 1) Create new "Theme" dimension
INSERT INTO public.tag_dimensions (slug, label, emoji, sort_order, description, is_multi_select, is_active)
VALUES ('theme', 'Theme', '🎯', 95, 'Cross-content themes like focus, energy, sleep', true, true)
ON CONFLICT (slug) DO NOTHING;

-- 2) Seed theme tags
WITH d AS (SELECT id FROM public.tag_dimensions WHERE slug='theme')
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order, is_active)
SELECT d.id, v.slug, v.label, v.emoji, v.so, true FROM d, (VALUES
  ('focus','Focus','🎯',1),
  ('energy','Energy','⚡',2),
  ('panic','Panic','🆘',3),
  ('sleep','Sleep','😴',4),
  ('dream','Dream','🌙',5),
  ('relaxation','Relaxation','🌿',6),
  ('alert','Alert','👁️',7),
  ('mastery','Mastery','🚀',8),
  ('calm','Calm','🕊️',9),
  ('destress','Destress','💆',10),
  ('stamina','Stamina','🏃',11),
  ('unwind','Unwind','🛋️',12)
) v(slug,label,emoji,so)
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- Helper: get tag ids
-- Theme tag links for breathing exercises (by name pattern)
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'breathing', b.id, t.id
FROM public.breathing_exercises b
JOIN public.tag_dimensions d ON d.slug='theme'
JOIN public.tags t ON t.dimension_id=d.id
WHERE
  (b.name ILIKE 'Alert%' AND t.slug='alert') OR
  (b.name ILIKE 'Dream%' AND t.slug='dream') OR
  (b.name ILIKE 'Energy%' AND t.slug='energy') OR
  (b.name ILIKE 'Focus%' AND t.slug='focus') OR
  (b.name ILIKE 'Master%' AND t.slug='mastery') OR
  (b.name ILIKE 'Panic%' AND t.slug='panic') OR
  (b.name ILIKE 'Relaxation%' AND t.slug='relaxation') OR
  (b.name ILIKE 'Sleep%' AND t.slug='sleep') OR
  (b.name ILIKE 'Calm%' AND t.slug='calm') OR
  (b.name ILIKE 'Destress%' AND t.slug='destress') OR
  (b.name ILIKE 'Stamina%' AND t.slug='stamina') OR
  (b.name ILIKE 'Unwind%' AND t.slug='unwind')
ON CONFLICT DO NOTHING;

-- Energy Breathing should also be tagged with productivity:focus? Skip. Keep theme-only.

-- 3) Reflections: emotion-based mapping
WITH em AS (
  SELECT t.id, t.slug FROM public.tags t JOIN public.tag_dimensions d ON d.id=t.dimension_id WHERE d.slug='emotion'
), door_em AS (
  SELECT id FROM public.tags WHERE slug='emotion' AND dimension_id=(SELECT id FROM public.tag_dimensions WHERE slug='door')
)
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, tag_id
FROM public.reflections r
CROSS JOIN LATERAL (
  SELECT (SELECT id FROM door_em) AS tag_id
  UNION ALL
  SELECT em.id FROM em WHERE
    (r.title ILIKE '%Angry%' AND em.slug='anger') OR
    (r.title ILIKE '%Anxious%' AND em.slug='anxiety') OR
    (r.title ILIKE '%Lonely%' AND em.slug='lonely') OR
    (r.title ILIKE '%Sad%' AND em.slug='sadness')
) x
WHERE r.category='emotion-based' AND tag_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4) Morning category → productivity:morning-routine + door:productivity
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON t.slug IN ('morning-routine','productivity')
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.category='morning'
  AND ((t.slug='morning-routine' AND d.slug='productivity') OR (t.slug='productivity' AND d.slug='door'))
ON CONFLICT DO NOTHING;

-- 5) Night category → productivity:evening-routine + door:productivity
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON t.slug IN ('evening-routine','productivity')
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.category='night'
  AND ((t.slug='evening-routine' AND d.slug='productivity') OR (t.slug='productivity' AND d.slug='door'))
ON CONFLICT DO NOTHING;

-- 6) Business-finance → door:productivity + productivity:planning, motivation
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.category='business-finance'
  AND (
    (t.slug='productivity' AND d.slug='door') OR
    (t.slug='planning' AND d.slug='productivity' AND r.title ILIKE '%Strategy%') OR
    (t.slug='motivation' AND d.slug='productivity' AND (r.title ILIKE '%Mindset%' OR r.title ILIKE '%Why%' OR r.title ILIKE '%Abundance%'))
  )
ON CONFLICT DO NOTHING;

-- 7) Calm category reflections → door:emotion + emotion:stressed (cooldown/rant/dump)
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.category='calm'
  AND (
    (t.slug='emotion' AND d.slug='door') OR
    (t.slug='stressed' AND d.slug='emotion')
  )
ON CONFLICT DO NOTHING;

-- Rant Zone also gets anger
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, (SELECT t.id FROM public.tags t JOIN public.tag_dimensions d ON d.id=t.dimension_id WHERE t.slug='anger' AND d.slug='emotion')
FROM public.reflections r WHERE r.title='Rant Zone'
ON CONFLICT DO NOTHING;

-- 8) Gratitude reflections → selfcare-category:gratitude + door:selfcare + selfcare-cluster:mind
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE (r.title ILIKE '%Gratitude%' OR r.title ILIKE '%Gratitue%' OR r.title='Appreciating Kindness of Others')
  AND (
    (t.slug='gratitude' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='mind' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 9) Affirmation / Confidence / Hype / Self-Affirmation → self-kindness
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE (r.title ILIKE '%Affirmation%' OR r.title ILIKE '%Confidence%' OR r.title='Hype Machine' OR r.title='Happiness Magnifier' OR r.title='Happy Diary')
  AND (
    (t.slug='self-kindness' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='mind' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 10) Loving-Kindness / Affection / Giving Kindness / Value of Kindness → connection + people cluster
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title IN ('Loving-Kindness','Affection Practice','Giving Kindness','Value of Kindness','What Would You Say to a Loved One?')
  AND (
    (t.slug='connection' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='people' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 11) Family / Friendships / Romantic Partners / Parenting / Past Romances → LovedOnes + people cluster + door:selfcare
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title IN ('Family','Friendships','Romantic Partners','Parenting','Past Romances')
  AND (
    (t.slug='LovedOnes' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='people' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 12) Body / Nutrition reflections
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title IN ('Meal Time','When You Want to Overeat','When You Abuse Alcohol')
  AND (
    (t.slug='nutrition' AND d.slug='selfcare-category' AND r.title IN ('Meal Time','When You Want to Overeat')) OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='body' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 13) Sleep Reflection / Dream Diary → theme tags
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE
  (r.title='Sleep Reflection' AND ((t.slug='sleep' AND d.slug='theme') OR (t.slug='sleep' AND d.slug='selfcare-category'))) OR
  (r.title='Dream Diary' AND t.slug='dream' AND d.slug='theme')
ON CONFLICT DO NOTHING;

-- 14) Managing Your Triggers → door:emotion
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title='Managing Your Triggers'
  AND (t.slug='emotion' AND d.slug='door')
ON CONFLICT DO NOTHING;

-- 15) You Need to Communicate → connection
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title='You Need to Communicate'
  AND (
    (t.slug='connection' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='people' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;

-- 16) Savoring Pleasant Moments → Presence + selfcare door + mind cluster
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT 'reflection', r.id, t.id
FROM public.reflections r
JOIN public.tags t ON true
JOIN public.tag_dimensions d ON d.id=t.dimension_id
WHERE r.title='Savoring Pleasant Moments'
  AND (
    (t.slug='Presence' AND d.slug='selfcare-category') OR
    (t.slug='selfcare' AND d.slug='door') OR
    (t.slug='mind' AND d.slug='selfcare-cluster')
  )
ON CONFLICT DO NOTHING;
